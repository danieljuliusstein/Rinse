/** Soft meta for activities (spam/trash/outbound) when PB has no extra fields. */

export type ActivityMeta = {
  trashed?: boolean
  spam?: boolean
  /** Agent/campaign outbound email — used by Inbox Sent vs Email folders */
  outbound?: boolean
}

const META_KEY = 'desk.activity_meta_v1'

function readAll(): Record<string, ActivityMeta> {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ActivityMeta>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, ActivityMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(map))
}

export function getActivityMeta(id: string): ActivityMeta {
  return readAll()[id] ?? {}
}

export function patchActivityMeta(id: string, patch: ActivityMeta): ActivityMeta {
  const all = readAll()
  const next = { ...all[id], ...patch }
  all[id] = next
  writeAll(all)
  return next
}

export function isActivityTrashed(id: string): boolean {
  return Boolean(getActivityMeta(id).trashed)
}

export function isActivitySpam(id: string): boolean {
  return Boolean(getActivityMeta(id).spam)
}

export function isActivityOutbound(id: string): boolean {
  return Boolean(getActivityMeta(id).outbound)
}

export function markActivityOutbound(id: string): void {
  patchActivityMeta(id, { outbound: true })
}

export function clearTourActivityMeta(): void {
  const isTourId = (id: string) => id.startsWith('tour-') || id.startsWith('dummy-') || id.startsWith('temp-')
  const all = readAll()
  let changed = false
  for (const k of Object.keys(all)) {
    if (isTourId(k)) {
      delete all[k]
      changed = true
    }
  }
  if (changed) writeAll(all)
}

/** Sent folder: explicit outbound flag, direction field, or legacy campaign-send subject prefix. */
export function isOutboundEmailActivity(a: {
  id: string
  type: string
  subject: string
  direction?: 'in' | 'out'
}): boolean {
  if (a.type !== 'email') return false
  if (a.direction === 'out') return true
  if (a.direction === 'in') return false
  if (isActivityOutbound(a.id)) return true
  return a.subject.startsWith('Campaign:')
}
