import type { ClientWithStats } from '@rinse/core'
import { normalizeReturnDays } from '@/src/lib/package-cadence'

export type ClientSegment = 'all' | 'followup' | 'top' | 'new'
export type ClientSort = 'revenue' | 'name' | 'recent'

export const CLIENT_SORT_OPTIONS: { key: ClientSort; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Last service' },
]
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

function daysSince(isoDate: string): number {
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

function daysSinceFirst(client: ClientWithStats): number {
  if (client.firstJobDate) return daysSince(client.firstJobDate)
  if (client.created) return daysSince(client.created.slice(0, 10))
  return 0
}

function isNewClient(client: ClientWithStats, sinceFirst: number): boolean {
  return client.jobCount === 1 || sinceFirst <= NEW_CLIENT_WINDOW_DAYS
}

function followUpAfterDays(client: ClientWithStats, sinceFirst: number): number {
  if (client.jobCount === 0) return Infinity
  if (isNewClient(client, sinceFirst)) return NEW_FOLLOW_UP_DAYS
  if (client.totalRevenue >= VIP_REVENUE_THRESHOLD) return VIP_FOLLOW_UP_DAYS
  return normalizeReturnDays(client.expectedReturnDays)
}

export function deriveClientFields(client: ClientWithStats): ClientDerived {
  const daysSinceLastJob = client.lastJobDate ? daysSince(client.lastJobDate) : null
  const daysSinceFirstVal = daysSinceFirst(client)
  const expectedReturnDays = normalizeReturnDays(client.expectedReturnDays)
  const followUpDays = followUpAfterDays(client, daysSinceFirstVal)
  const cadence = normalizeReturnDays(expectedReturnDays)
  const totalJobsExpected = Math.max(1, Math.round(daysSinceFirstVal / cadence))
  const retention = Math.min(100, Math.round((client.jobCount / totalJobsExpected) * 100))
  const isVip = client.totalRevenue >= VIP_REVENUE_THRESHOLD

  let tag: ClientTag = null
  if (isNewClient(client, daysSinceFirstVal)) {
    tag = 'new'
  } else if (daysSinceLastJob != null && daysSinceLastJob >= followUpDays) {
    tag = 'followup'
  }

  return {
    initials: deriveInitials(client.name),
    daysSinceLastJob,
    daysSinceFirst: daysSinceFirstVal,
    expectedReturnDays,
    followUpAfterDays: followUpDays,
    retentionScore: retention,
    isVip,
    tag,
  }
}

export function buildDerivedMap(clients: ClientWithStats[]): Map<string, ClientDerived> {
  const map = new Map<string, ClientDerived>()
  for (const client of clients) {
    map.set(client.id, deriveClientFields(client))
  }
  return map
}

export function isOverdue(client: ClientWithStats, derived: ClientDerived): boolean {
  if (derived.daysSinceLastJob == null) return false
  return derived.daysSinceLastJob >= derived.followUpAfterDays
}

export function filterClientsBySegment(clients: ClientWithStats[], segment: ClientSegment): ClientWithStats[] {
  if (segment === 'all') return clients
  if (segment === 'top') {
    return [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10)
  }
  const derivedMap = buildDerivedMap(clients)
  return clients.filter((client) => {
    const sinceFirst = daysSinceFirst(client)
    const sinceLast = client.lastJobDate ? daysSince(client.lastJobDate) : null
    if (segment === 'new') return isNewClient(client, sinceFirst)
    if (segment === 'followup') {
      const d = derivedMap.get(client.id)
      return d != null && isOverdue(client, d)
    }
    return true
  })
}

export function sortClients(list: ClientWithStats[], sort: ClientSort): ClientWithStats[] {
  const copy = [...list]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'recent') {
    return copy.sort((a, b) => (b.lastJobDate ?? '').localeCompare(a.lastJobDate ?? ''))
  }
  return copy.sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export function searchClients(clients: ClientWithStats[], query: string): ClientWithStats[] {
  const q = query.trim().toLowerCase()
  if (!q) return clients
  return clients.filter((c) => {
    const hay = [c.name, c.phone, c.email, c.address].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export const CLIENT_SEGMENT_CHIPS: { key: ClientSegment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'followup', label: 'Follow up' },
  { key: 'top', label: 'Top' },
  { key: 'new', label: 'New' },
]

export function countFollowUpClients(clients: ClientWithStats[]): number {
  return filterClientsBySegment(clients, 'followup').length
}

export function overdueClients(clients: ClientWithStats[]): ClientWithStats[] {
  const derivedMap = buildDerivedMap(clients)
  return clients.filter((c) => {
    const d = derivedMap.get(c.id)
    return d != null && isOverdue(c, d)
  })
}

export function topClientsByRevenue(clients: ClientWithStats[], limit = 3): ClientWithStats[] {
  return [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit)
}
