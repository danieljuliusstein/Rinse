import { authenticateServerAdmin } from './pocketbase-admin'
import type { PbRecord } from '../api/mappers'

export type PlatformEventCategory = 'product' | 'security' | 'admin' | 'billing'

export type PlatformEventType =
  | 'org_created'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'setup_intro_slide_viewed'
  | 'admin_org_updated'
  | 'admin_backup_triggered'
  | 'auth_failure'
  | 'webhook_reject'
  | 'subscription_status_changed'
  | 'invoice_payment_failed'

const EVENT_CATEGORY: Record<PlatformEventType, PlatformEventCategory> = {
  org_created: 'product',
  onboarding_step_viewed: 'product',
  onboarding_step_completed: 'product',
  onboarding_completed: 'product',
  setup_intro_slide_viewed: 'product',
  admin_org_updated: 'admin',
  admin_backup_triggered: 'admin',
  auth_failure: 'security',
  webhook_reject: 'security',
  subscription_status_changed: 'billing',
  invoice_payment_failed: 'billing',
}

export const CLIENT_PLATFORM_EVENT_TYPES = [
  'onboarding_step_viewed',
  'onboarding_step_completed',
  'onboarding_completed',
  'setup_intro_slide_viewed',
] as const satisfies readonly PlatformEventType[]

export type ClientPlatformEventType = (typeof CLIENT_PLATFORM_EVENT_TYPES)[number]

export interface PlatformEventRecord {
  id: string
  type: PlatformEventType
  category: PlatformEventCategory
  organization_id: string | null
  actor_email: string | null
  detail: string | null
  metadata: Record<string, unknown> | null
  created: string
}

export interface LogPlatformEventInput {
  category?: PlatformEventCategory
  organizationId?: string | null
  actorEmail?: string | null
  detail?: string | null
  metadata?: Record<string, unknown>
}

/** Persist a platform event. Never throws — analytics must not break product flows. */
export async function logPlatformEvent(
  type: PlatformEventType,
  input: LogPlatformEventInput = {},
): Promise<void> {
  try {
    const pb = await authenticateServerAdmin()
    await pb.collection('platform_events').create({
      type,
      category: input.category ?? EVENT_CATEGORY[type],
      organization_id: input.organizationId || undefined,
      actor_email: input.actorEmail?.trim() || undefined,
      detail: input.detail?.trim() || undefined,
      metadata: input.metadata ?? undefined,
      occurred_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn(
      '[platform-events] failed to persist',
      type,
      err instanceof Error ? err.message : err,
    )
  }
}

function eventTimestamp(record: PbRecord): string {
  const occurred = record.occurred_at ? String(record.occurred_at) : ''
  if (occurred) return occurred
  const meta = record.metadata
  if (meta && typeof meta === 'object' && typeof (meta as { created?: unknown }).created === 'string') {
    return (meta as { created: string }).created
  }
  return String(record.created ?? '')
}

function mapEvent(record: PbRecord): PlatformEventRecord {
  return {
    id: String(record.id),
    type: String(record.type ?? '') as PlatformEventType,
    category: String(record.category ?? 'product') as PlatformEventCategory,
    organization_id: record.organization_id ? String(record.organization_id) : null,
    actor_email: record.actor_email ? String(record.actor_email) : null,
    detail: record.detail ? String(record.detail) : null,
    metadata:
      record.metadata && typeof record.metadata === 'object'
        ? (record.metadata as Record<string, unknown>)
        : null,
    created: eventTimestamp(record),
  }
}

export interface ListPlatformEventsOptions {
  limit?: number
  type?: string
  organizationId?: string
  category?: PlatformEventCategory
}

export async function listPlatformEvents(
  options: ListPlatformEventsOptions = {},
): Promise<PlatformEventRecord[]> {
  const pb = await authenticateServerAdmin()
  const filters: string[] = []
  if (options.type) filters.push(`type = "${escapeFilter(options.type)}"`)
  if (options.organizationId) {
    filters.push(`organization_id = "${escapeFilter(options.organizationId)}"`)
  }
  if (options.category) filters.push(`category = "${escapeFilter(options.category)}"`)

  const records = await pb.collection('platform_events').getList<PbRecord>(1, options.limit ?? 100, {
    sort: '-id',
    ...(filters.length ? { filter: filters.join(' && ') } : {}),
  })

  return records.items.map(mapEvent)
}

export interface SignupDayMetric {
  date: string
  count: number
}

export interface SignupMetricsResult {
  days: number
  total: number
  series: SignupDayMetric[]
}

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function escapeFilter(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Daily org signups for the admin sparkline — org_created events, with org.created fallback. */
export async function getSignupMetrics(days = 30): Promise<SignupMetricsResult> {
  const pb = await authenticateServerAdmin()
  const safeDays = Math.min(Math.max(days, 7), 90)
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - (safeDays - 1))
  const startIso = start.toISOString()

  const series: SignupDayMetric[] = []
  const counts = new Map<string, number>()
  for (let i = 0; i < safeDays; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const key = utcDayKey(d)
    counts.set(key, 0)
    series.push({ date: key, count: 0 })
  }

  try {
    const events = await pb.collection('platform_events').getFullList<PbRecord>({
      filter: 'type = "org_created"',
      sort: '-id',
    })
    for (const event of events) {
      const ts = eventTimestamp(event)
      if (!ts) continue
      const key = ts.slice(0, 10)
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  } catch {
    /* collection may not exist until migration runs */
  }

  if ([...counts.values()].every((n) => n === 0)) {
    try {
      const orgs = await pb.collection('organizations').getFullList<PbRecord>({
        sort: '-id',
      })
      for (const org of orgs) {
        if (org.is_platform_internal === true) continue
        const key = String(org.created ?? '').slice(0, 10)
        if (!key || !counts.has(key)) continue
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    } catch {
      /* organizations list may fail on older PB snapshots */
    }
  }

  let total = 0
  for (const point of series) {
    point.count = counts.get(point.date) ?? 0
    total += point.count
  }

  return { days: safeDays, total, series }
}

import { PLATFORM_EVENT_LABELS, formatPlatformEventTime } from '../platform-event-labels'

export { PLATFORM_EVENT_LABELS, formatPlatformEventTime }
