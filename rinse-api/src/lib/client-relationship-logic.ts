import { DEFAULT_RETURN_DAYS, normalizeReturnDays } from './package-cadence'
import type { ClientWithStats } from './types'

export type ClientSegment = 'all' | 'followup' | 'top' | 'new'
export type ClientTag = 'followup' | 'new' | null

export interface ClientDerived {
  initials: string
  daysSinceLastJob: number | null
  daysSinceFirst: number
  expectedReturnDays: number
  followUpAfterDays: number
  retentionScore: number
  isVip: boolean
  tag: ClientTag
}

const MS_PER_DAY = 86_400_000
const VIP_REVENUE_THRESHOLD = 500
const NEW_CLIENT_WINDOW_DAYS = 30
const NEW_FOLLOW_UP_DAYS = 21
const VIP_FOLLOW_UP_DAYS = 60

export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function daysSince(isoDate: string): number {
  const d = new Date(isoDate.slice(0, 10) + 'T12:00:00')
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.floor((now.getTime() - d.getTime()) / MS_PER_DAY)
}

export function timeAgo(isoDate: string): string {
  const days = daysSince(isoDate)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

/** Jobs vs expected visits based on the client's service cadence. */
export function retentionScore(
  jobCount: number,
  daysSinceFirstJob: number,
  expectedReturnDays: number
): number {
  const cadence = normalizeReturnDays(expectedReturnDays)
  const totalJobsExpected = Math.max(1, Math.round(daysSinceFirstJob / cadence))
  return Math.min(100, Math.round((jobCount / totalJobsExpected) * 100))
}

export function retentionColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f5a623'
  return '#e06060'
}

export function daysSinceFirstForClient(client: ClientWithStats): number {
  if (client.firstJobDate) return daysSince(client.firstJobDate)
  if (client.created) return daysSince(client.created.slice(0, 10))
  return 0
}

export function isNewClient(client: ClientWithStats, daysSinceFirst: number): boolean {
  return client.jobCount === 1 || daysSinceFirst <= NEW_CLIENT_WINDOW_DAYS
}

/** Days idle before a client is due for follow-up (tiered by relationship). */
export function followUpAfterDays(client: ClientWithStats, daysSinceFirst: number): number {
  if (client.jobCount === 0) return Infinity
  if (isNewClient(client, daysSinceFirst)) return NEW_FOLLOW_UP_DAYS
  if (client.totalRevenue >= VIP_REVENUE_THRESHOLD) return VIP_FOLLOW_UP_DAYS
  return normalizeReturnDays(client.expectedReturnDays)
}

export function deriveClientFields(client: ClientWithStats): ClientDerived {
  const daysSinceLastJob = client.lastJobDate ? daysSince(client.lastJobDate) : null
  const daysSinceFirst = daysSinceFirstForClient(client)
  const expectedReturnDays = normalizeReturnDays(client.expectedReturnDays)
  const followUpDays = followUpAfterDays(client, daysSinceFirst)
  const score = retentionScore(client.jobCount, daysSinceFirst, expectedReturnDays)
  const isVip = client.totalRevenue >= VIP_REVENUE_THRESHOLD

  let tag: ClientTag = null
  if (isNewClient(client, daysSinceFirst)) {
    tag = 'new'
  } else if (daysSinceLastJob != null && daysSinceLastJob >= followUpDays) {
    tag = 'followup'
  }

  return {
    initials: deriveInitials(client.name),
    daysSinceLastJob,
    daysSinceFirst,
    expectedReturnDays,
    followUpAfterDays: followUpDays,
    retentionScore: score,
    isVip,
    tag,
  }
}

export function isOverdue(client: ClientWithStats, derived: ClientDerived): boolean {
  if (derived.daysSinceLastJob == null) return false
  return derived.daysSinceLastJob >= derived.followUpAfterDays
}

export function filterBySegment(
  clients: ClientWithStats[],
  segment: ClientSegment,
  derivedMap: Map<string, ClientDerived>
): ClientWithStats[] {
  if (segment === 'all') return clients

  if (segment === 'followup') {
    return clients.filter((c) => {
      const d = derivedMap.get(c.id)
      return d != null && isOverdue(c, d)
    })
  }

  if (segment === 'top') {
    const sorted = [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue)
    const cutoff = Math.ceil(sorted.length / 2)
    return sorted.slice(0, cutoff)
  }

  return clients.filter((c) => {
    const d = derivedMap.get(c.id)
    if (!d) return false
    return isNewClient(c, d.daysSinceFirst)
  })
}

export function sortForSegment(
  clients: ClientWithStats[],
  segment: ClientSegment,
  derivedMap: Map<string, ClientDerived>
): ClientWithStats[] {
  const list = [...clients]

  if (segment === 'followup') {
    return list.sort((a, b) => {
      const da = derivedMap.get(a.id)?.daysSinceLastJob ?? 0
      const db = derivedMap.get(b.id)?.daysSinceLastJob ?? 0
      return db - da
    })
  }

  if (segment === 'top') {
    return list.sort((a, b) => b.totalRevenue - a.totalRevenue)
  }

  if (segment === 'new') {
    return list.sort((a, b) => {
      const ca = a.created ?? ''
      const cb = b.created ?? ''
      return cb.localeCompare(ca)
    })
  }

  return list
}

export function partitionForAll(
  clients: ClientWithStats[],
  derivedMap: Map<string, ClientDerived>
): { needsAttention: ClientWithStats[]; rest: ClientWithStats[] } {
  const needsAttention: ClientWithStats[] = []
  const rest: ClientWithStats[] = []

  for (const client of clients) {
    const d = derivedMap.get(client.id)
    if (d && isOverdue(client, d)) {
      needsAttention.push(client)
    } else {
      rest.push(client)
    }
  }

  needsAttention.sort((a, b) => {
    const da = derivedMap.get(a.id)?.daysSinceLastJob ?? 0
    const db = derivedMap.get(b.id)?.daysSinceLastJob ?? 0
    return db - da
  })

  rest.sort((a, b) => b.totalRevenue - a.totalRevenue)

  return { needsAttention, rest }
}

export function buildDerivedMap(clients: ClientWithStats[]): Map<string, ClientDerived> {
  const map = new Map<string, ClientDerived>()
  for (const client of clients) {
    map.set(client.id, deriveClientFields(client))
  }
  return map
}

export function overdueClients(
  clients: ClientWithStats[],
  derivedMap: Map<string, ClientDerived>
): ClientWithStats[] {
  return clients.filter((c) => {
    const d = derivedMap.get(c.id)
    return d != null && isOverdue(c, d)
  })
}

export function topClientsByRevenue(clients: ClientWithStats[], limit = 3): ClientWithStats[] {
  return [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit)
}
