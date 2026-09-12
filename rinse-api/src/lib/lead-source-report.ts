import { jobInRange, rangeFor } from './api/aggregates'
import type { DateRangeKey } from './api/reports'
import type { Client, Job } from './types'

export interface LeadSourceRow {
  source: string
  clientCount: number
  jobCount: number
  revenue: number
  avgTicket: number
}

function normalizeSource(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) return 'Unknown'
  return raw.trim()
}

function formatSourceLabel(source: string): string {
  if (source === 'Unknown') return source
  return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function buildLeadSourceReport(
  clients: Client[],
  jobs: Job[],
  range: DateRangeKey,
  now = new Date()
): LeadSourceRow[] {
  const { start, end } = rangeFor(range, now)
  const jobsInRange = jobs.filter((j) => jobInRange(j, start, end))

  const clientById = new Map(clients.map((c) => [c.id, c]))
  const clientsSeen = new Map<string, Set<string>>()
  const buckets = new Map<string, { jobCount: number; revenue: number }>()

  for (const job of jobsInRange) {
    const client = clientById.get(job.client_id)
    const sourceKey = normalizeSource(client?.lead_source)
    const bucket = buckets.get(sourceKey) ?? { jobCount: 0, revenue: 0 }
    bucket.jobCount += 1
    bucket.revenue += job.revenue + job.tip
    buckets.set(sourceKey, bucket)

    if (!clientsSeen.has(sourceKey)) clientsSeen.set(sourceKey, new Set())
    clientsSeen.get(sourceKey)!.add(job.client_id)
  }

  return [...buckets.entries()]
    .map(([sourceKey, stats]) => ({
      source: formatSourceLabel(sourceKey),
      clientCount: clientsSeen.get(sourceKey)?.size ?? 0,
      jobCount: stats.jobCount,
      revenue: Math.round(stats.revenue * 100) / 100,
      avgTicket: stats.jobCount > 0 ? Math.round((stats.revenue / stats.jobCount) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}
