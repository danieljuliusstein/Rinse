import { normalizeJobDate } from '@/src/lib/jobs-list'
import {
    computePLReport,
    computePLReportForDates,
    getPLReportBundle,
    jobInRange,
    lifetimeActivityStart,
    priorRangeFor,
    rangeFor,
    reportBoundsFor,
    type DateRangeKey,
    type PLReport,
} from '@rinse/core'

// The P&L aggregation and date-range helpers (`computePLReportForDates`,
// `computePLReport`, `getPLReportBundle`, `rangeFor`, `priorRangeFor`,
// `jobInRange`, `reportBoundsFor`, `lifetimeActivityStart`, and the `PLReport`
// / `DateRangeKey` types) are owned by the shared @rinse/core package (the
// single source of truth) and re-exported here so existing mobile imports keep
// working. `computePLReportForDates` excludes cancelled jobs internally via
// `activeJobs`, so cancelled work never inflates revenue/profit/counts
// regardless of caller input. Mobile keeps the `listJobs` `status !=
// "cancelled"` fetch filter as the primary fetch-layer exclusion
// (defense-in-depth). The pieces below (`parseReportDate`,
// `REPORT_FILTER_CHIPS`) are mobile-only and stay local.
export {
    computePLReport,
    computePLReportForDates,
    getPLReportBundle,
    jobInRange,
    lifetimeActivityStart,
    priorRangeFor,
    rangeFor,
    reportBoundsFor
}
export type { DateRangeKey, PLReport }

/** Parse job / expense date-only (handles PocketBase `YYYY-MM-DD HH:mm:ss.SSSZ`). */
export function parseReportDate(dateStr: string): Date {
  const day = normalizeJobDate(dateStr)
  return new Date(`${day}T12:00:00`)
}

export const REPORT_FILTER_CHIPS: { key: DateRangeKey; labelKey: string }[] = [
  { key: 'this_week', labelKey: 'business.ranges.this_week' },
  { key: 'this_month', labelKey: 'business.ranges.this_month' },
  { key: 'last_month', labelKey: 'business.ranges.last_month' },
  { key: 'this_year', labelKey: 'business.ranges.this_year' },
  { key: 'lifetime', labelKey: 'business.ranges.lifetime' },
]
