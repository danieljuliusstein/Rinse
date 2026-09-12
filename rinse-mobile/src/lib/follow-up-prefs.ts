import type { ClientWithStats } from '@rinse/core'

export type FollowUpSuppression = {
  /** ISO timestamp — hide while now < until */
  until?: string
  /** lastJobDate snapshot (YYYY-MM-DD or '') — hide while client.lastJobDate matches */
  untilNextJobAfter?: string
}

export type FollowUpPrefs = {
  showFollowUpSection: boolean
  suppressions: Record<string, FollowUpSuppression>
}

export const DEFAULT_FOLLOW_UP_PREFS: FollowUpPrefs = {
  showFollowUpSection: true,
  suppressions: {},
}

export const SNOOZE_DAYS = {
  week: 7,
  month: 30,
} as const

function lastJobKey(client: Pick<ClientWithStats, 'lastJobDate'>): string {
  return client.lastJobDate?.slice(0, 10) ?? ''
}

export function normalizeFollowUpPrefs(raw: unknown): FollowUpPrefs {
  if (typeof raw !== 'object' || raw == null) return { ...DEFAULT_FOLLOW_UP_PREFS, suppressions: {} }
  const obj = raw as Record<string, unknown>
  const suppressions: Record<string, FollowUpSuppression> = {}
  if (typeof obj.suppressions === 'object' && obj.suppressions != null) {
    for (const [id, value] of Object.entries(obj.suppressions as Record<string, unknown>)) {
      if (typeof value !== 'object' || value == null) continue
      const v = value as Record<string, unknown>
      const entry: FollowUpSuppression = {}
      if (typeof v.until === 'string' && v.until.length > 0) entry.until = v.until
      if (typeof v.untilNextJobAfter === 'string') entry.untilNextJobAfter = v.untilNextJobAfter
      if (entry.until != null || entry.untilNextJobAfter != null) suppressions[id] = entry
    }
  }
  return {
    showFollowUpSection: obj.showFollowUpSection !== false,
    suppressions,
  }
}

/** Pure check — used by UI and unit tests. */
export function isFollowUpSuppressed(
  client: Pick<ClientWithStats, 'id' | 'lastJobDate'>,
  prefs: FollowUpPrefs,
  now: Date = new Date(),
): boolean {
  const entry = prefs.suppressions[client.id]
  if (!entry) return false

  if (entry.until) {
    const untilMs = Date.parse(entry.until)
    if (!Number.isNaN(untilMs) && now.getTime() < untilMs) return true
  }

  if (entry.untilNextJobAfter != null && lastJobKey(client) === entry.untilNextJobAfter) {
    return true
  }

  return false
}

export function snoozeClientInPrefs(
  prefs: FollowUpPrefs,
  clientId: string,
  days: number,
  now: Date = new Date(),
): FollowUpPrefs {
  const until = new Date(now.getTime() + days * 86_400_000).toISOString()
  return {
    ...prefs,
    suppressions: {
      ...prefs.suppressions,
      [clientId]: { until },
    },
  }
}

export function dismissUntilNextJobInPrefs(
  prefs: FollowUpPrefs,
  client: Pick<ClientWithStats, 'id' | 'lastJobDate'>,
): FollowUpPrefs {
  return {
    ...prefs,
    suppressions: {
      ...prefs.suppressions,
      [client.id]: { untilNextJobAfter: lastJobKey(client) },
    },
  }
}

/** Drop expired snoozes and dismissals cleared by a newer job. */
export function pruneFollowUpPrefs(
  prefs: FollowUpPrefs,
  clients: Pick<ClientWithStats, 'id' | 'lastJobDate'>[],
  now: Date = new Date(),
): FollowUpPrefs {
  const byId = new Map(clients.map((c) => [c.id, c]))
  const next: Record<string, FollowUpSuppression> = {}
  let changed = false

  for (const [id, entry] of Object.entries(prefs.suppressions)) {
    const client = byId.get(id)
    const keep: FollowUpSuppression = {}

    if (entry.until) {
      const untilMs = Date.parse(entry.until)
      if (!Number.isNaN(untilMs) && now.getTime() < untilMs) {
        keep.until = entry.until
      } else {
        changed = true
      }
    }

    if (entry.untilNextJobAfter != null) {
      if (client && lastJobKey(client) === entry.untilNextJobAfter) {
        keep.untilNextJobAfter = entry.untilNextJobAfter
      } else {
        changed = true
      }
    }

    if (keep.until != null || keep.untilNextJobAfter != null) {
      next[id] = keep
    } else if (prefs.suppressions[id]) {
      changed = true
    }
  }

  if (!changed && Object.keys(next).length === Object.keys(prefs.suppressions).length) {
    return prefs
  }
  return { ...prefs, suppressions: next }
}
