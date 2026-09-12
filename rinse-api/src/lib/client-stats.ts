import { DEFAULT_RETURN_DAYS, normalizeReturnDays } from './package-cadence'
import type { Client, ClientWithStats, Job, Package } from './types'

export function enrichClientWithStats(
  client: Client,
  clientJobs: Job[],
  packages: Package[]
): ClientWithStats {
  const sorted = [...clientJobs].sort((a, b) => b.date.localeCompare(a.date))
  const lastJob = sorted[0]
  const firstJob = sorted[sorted.length - 1]
  const totalRevenue = clientJobs.reduce((s, j) => s + j.revenue + j.tip, 0)
  const lastPackage = lastJob ? packages.find((p) => p.id === lastJob.package_id) : undefined

  return {
    ...client,
    totalRevenue,
    jobCount: clientJobs.length,
    lastJobDate: lastJob?.date ?? null,
    firstJobDate: firstJob?.date ?? null,
    lastServiceName: lastPackage?.name ?? null,
    expectedReturnDays: normalizeReturnDays(lastPackage?.expected_return_days ?? DEFAULT_RETURN_DAYS),
  }
}
