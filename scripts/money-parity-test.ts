/**
 * Mobile money-parity test (task 5.2).
 *
 * PURPOSE: prove that the MOBILE app's money aggregation
 * (`apps/rinse-mobile/src/lib/reports.ts`) produces exactly the same P&L
 * numbers as the canonical `@rinse/core` baseline when fed the SAME shared
 * fixture the cross-app parity suite uses. This is the mobile half of the
 * Requirement 4.1 equality guarantee.
 *
 * Mobile uses `tsx` for logic tests (see `scripts/native-smoke.ts`), so this is
 * a standalone tsx script rather than a Vitest spec. Run from rinse-mobile/:
 *
 *   npx tsx scripts/money-parity-test.ts
 *
 * It imports the SAME fixture module the desktop parity suite uses
 * (`apps/api/src/lib/api/__parity__/money-parity-fixture.ts`). That module's
 * only api-side dependency is a type-only `import type { Invoice, Job }`, which
 * tsx strips at runtime, so it loads cleanly here with no api runtime deps.
 *
 * Coverage in this file:
 *   - Mobile aggregation === core baseline for revenue, totalExpenses,
 *     netProfit, marginPct, and jobCount (Requirement 4.1).
 *   - The cancelled fixture job's amount appears in NO total (Requirement 4.2).
 *   - Mobile lifetime bounds match the core baseline (Requirement 3.3).
 *
 * Validates: Requirements 4.1, 4.2, 4.3
 */
import {
    activeJobs,
    computePLReportForDates as coreComputePLReportForDates,
    reportBoundsFor as coreReportBoundsFor,
} from '@rinse/core'

// Mobile (this app) money math — real production module.
import {
    computePLReportForDates as computePLReportForDatesMobile,
    reportBoundsFor as reportBoundsForMobile,
} from '../src/lib/reports'

// The SAME shared fixture the desktop cross-app parity suite consumes.
import {
    CANCELLED_JOB_REVENUE,
    FIXTURE_BUSINESS_EXPENSE_ROWS,
    FIXTURE_BUSINESS_EXPENSES,
    FIXTURE_JOBS,
    FIXTURE_OVERHEAD,
} from '../../api/src/lib/api/__parity__/money-parity-fixture'

// Fixed clock so lifetime bounds are deterministic.
const NOW = new Date('2024-06-15T12:00:00')

interface Check {
  label: string
  pass: boolean
  detail?: string
}

const checks: Check[] = []

function assert(label: string, condition: boolean, detail?: string): void {
  checks.push({ label, pass: condition, detail })
  const icon = condition ? '\u2713' : '\u2717'
  console.log(`${icon} ${label}${detail ? ` \u2014 ${detail}` : ''}`)
}

// --- Compute the core baseline (single source of truth) ---
const coreRange = coreReportBoundsFor('lifetime', FIXTURE_JOBS, FIXTURE_BUSINESS_EXPENSE_ROWS, NOW)
const coreReport = coreComputePLReportForDates(
  FIXTURE_JOBS, // cancelled job excluded internally by core activeJobs
  coreRange.start,
  coreRange.end,
  FIXTURE_OVERHEAD,
  FIXTURE_BUSINESS_EXPENSES,
)

// --- Compute the mobile result through the real mobile module ---
// Mobile's data layer (listJobs) pre-excludes cancelled jobs via activeJobs, so
// feed the mobile report activeJobs(FIXTURE_JOBS), matching production.
const mobileRange = reportBoundsForMobile('lifetime', activeJobs(FIXTURE_JOBS), FIXTURE_BUSINESS_EXPENSE_ROWS, NOW)
const mobileReport = computePLReportForDatesMobile(
  activeJobs(FIXTURE_JOBS),
  mobileRange.start,
  mobileRange.end,
  FIXTURE_OVERHEAD,
  FIXTURE_BUSINESS_EXPENSES,
)

// --- Equality: mobile aggregation === core baseline (Req 4.1) ---
assert('mobile revenue === core baseline', mobileReport.revenue === coreReport.revenue, `${mobileReport.revenue} vs ${coreReport.revenue}`)
assert('mobile totalExpenses === core baseline', mobileReport.totalExpenses === coreReport.totalExpenses, `${mobileReport.totalExpenses} vs ${coreReport.totalExpenses}`)
assert('mobile netProfit === core baseline', mobileReport.netProfit === coreReport.netProfit, `${mobileReport.netProfit} vs ${coreReport.netProfit}`)
assert('mobile marginPct === core baseline', mobileReport.marginPct === coreReport.marginPct, `${mobileReport.marginPct} vs ${coreReport.marginPct}`)
assert('mobile jobCount === core baseline', mobileReport.jobCount === coreReport.jobCount, `${mobileReport.jobCount} vs ${coreReport.jobCount}`)

// --- Cancelled-job exclusion (Req 4.2) ---
const expectedActiveRevenue = activeJobs(FIXTURE_JOBS).reduce((s, j) => s + j.revenue + j.tip, 0)
assert('mobile jobCount excludes cancelled (3 active)', mobileReport.jobCount === 3, String(mobileReport.jobCount))
assert(
  'mobile revenue = sum over active jobs only (cancelled $1,110 absent)',
  mobileReport.revenue === expectedActiveRevenue && mobileReport.revenue !== expectedActiveRevenue + CANCELLED_JOB_REVENUE,
  `revenue=${mobileReport.revenue}, cancelled=${CANCELLED_JOB_REVENUE}`,
)

// --- Lifetime bounds match the core baseline (Req 3.3) ---
assert('mobile lifetime start === core baseline', mobileRange.start.getTime() === coreRange.start.getTime())
assert('mobile lifetime end === core baseline', mobileRange.end.getTime() === coreRange.end.getTime())

// --- Summary ---
const failed = checks.filter((c) => !c.pass)
console.log('')
console.log(`Mobile money parity: ${checks.length - failed.length}/${checks.length} passed`)
if (failed.length > 0) {
  process.exitCode = 1
}
