/**
 * Desktop CRM money-parity test.
 *
 * Proves Desk P&L aggregation matches the vendored rinse-core baseline
 * when fed the shared fixture.
 *
 *   pnpm money-parity
 */
import { getDeskMoneyBundle } from '../src/lib/desk-money'
import { overheadForDateRange, sumBusinessExpensesInRange } from '../src/lib/expense-totals'
import {
  activeJobs,
  computePLReportForDates as coreComputePLReportForDates,
  reportBoundsFor as coreReportBoundsFor,
} from '../src/lib/rinse-core'
import { toCoreBusinessExpenses, toCoreJobs } from '../src/lib/to-core-job'
import type { DeskExpense, DeskJob } from '../src/lib/types'
import {
  CANCELLED_JOB_REVENUE,
  FIXTURE_BUSINESS_EXPENSE_ROWS,
  FIXTURE_BUSINESS_EXPENSES,
  FIXTURE_JOBS,
  FIXTURE_OVERHEAD,
} from '../src/lib/money-parity-fixture'

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

const deskJobs: DeskJob[] = FIXTURE_JOBS.map((j) => ({
  id: j.id,
  date: j.date,
  status: j.status,
  revenue: j.revenue,
  tip: j.tip,
  expenses: j.expenses.map((e) => ({
    amount: e.amount,
    category: e.category,
    description: e.description,
  })),
  travel_cost: j.travel_cost,
  marketing_cost: j.marketing_cost,
  equipment_depreciation: j.equipment_depreciation,
  client_id: j.client_id,
  package_id: j.package_id,
}))

const deskExpenses: DeskExpense[] = FIXTURE_BUSINESS_EXPENSE_ROWS.map((e) => ({
  id: e.id,
  date: e.date,
  name: e.name,
  description: e.name,
  amount: e.amount,
}))

const coreJobs = toCoreJobs(deskJobs)
const bizRows = toCoreBusinessExpenses(deskExpenses)

const coreRange = coreReportBoundsFor('lifetime', FIXTURE_JOBS, FIXTURE_BUSINESS_EXPENSE_ROWS, NOW)
const coreReport = coreComputePLReportForDates(
  FIXTURE_JOBS,
  coreRange.start,
  coreRange.end,
  0,
  FIXTURE_BUSINESS_EXPENSES,
)

const deskBundle = getDeskMoneyBundle(deskJobs, deskExpenses, [], 'lifetime', NOW)
const deskReport = deskBundle.current

assert(
  'Desktop lifetime revenue === core',
  deskReport.revenue === coreReport.revenue,
  `desk=${deskReport.revenue} core=${coreReport.revenue}`,
)
assert(
  'Desktop lifetime totalExpenses === core',
  deskReport.totalExpenses === coreReport.totalExpenses,
  `desk=${deskReport.totalExpenses} core=${coreReport.totalExpenses}`,
)
assert(
  'Desktop lifetime netProfit === core',
  deskReport.netProfit === coreReport.netProfit,
  `desk=${deskReport.netProfit} core=${coreReport.netProfit}`,
)
assert('Desktop lifetime marginPct === core', deskReport.marginPct === coreReport.marginPct)
assert('Desktop lifetime jobCount === core', deskReport.jobCount === coreReport.jobCount)
assert(
  'Cancelled job revenue excluded from desktop totals',
  deskReport.revenue === coreReport.revenue && deskReport.revenue !== CANCELLED_JOB_REVENUE,
  `revenue=${deskReport.revenue}`,
)
assert(
  'Desktop lifetime start === core',
  deskBundle.bounds.start.getTime() === coreRange.start.getTime(),
  `desk=${deskBundle.bounds.start.toISOString()} core=${coreRange.start.toISOString()}`,
)

const inRange = sumBusinessExpensesInRange(bizRows, coreRange.start, coreRange.end)
assert(
  'Business receipts in range match fixture scalar',
  inRange === FIXTURE_BUSINESS_EXPENSES,
  `inRange=${inRange}`,
)

const overheadItems = [
  {
    id: 'oh_1',
    name: 'Insurance',
    amount: FIXTURE_OVERHEAD,
    billing_cycle: 'one_time' as const,
    next_due: '2022-03-10',
  },
]
const overheadTotal = overheadForDateRange(overheadItems, coreRange.start, coreRange.end)
const coreWithOverhead = coreComputePLReportForDates(
  FIXTURE_JOBS,
  coreRange.start,
  coreRange.end,
  overheadTotal,
  FIXTURE_BUSINESS_EXPENSES,
)
const deskWithOverhead = getDeskMoneyBundle(deskJobs, deskExpenses, overheadItems, 'lifetime', NOW)
assert(
  'Desktop with prorated overhead netProfit === core',
  deskWithOverhead.current.netProfit === coreWithOverhead.netProfit,
  `desk=${deskWithOverhead.current.netProfit} core=${coreWithOverhead.netProfit}`,
)

assert('toCoreJobs preserves active job count', toCoreJobs(deskJobs).length === FIXTURE_JOBS.length)
assert(
  'activeJobs fixture count',
  activeJobs(coreJobs).length === FIXTURE_JOBS.filter((j) => j.status !== 'cancelled').length,
)
assert('toCoreBusinessExpenses maps fixture rows', bizRows.length === FIXTURE_BUSINESS_EXPENSE_ROWS.length)

const failed = checks.filter((c) => !c.pass)
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed`)
  process.exit(1)
}

console.log(`\nAll ${checks.length} desktop money-parity checks passed.`)
