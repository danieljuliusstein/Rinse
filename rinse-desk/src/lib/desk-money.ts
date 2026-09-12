import {
  computePLReportForDates,
  priorRangeFor,
  reportBoundsFor,
  type DateRangeKey,
  type PLReport,
} from '@/lib/rinse-core'
import type { OverheadExpense } from '@/lib/rinse-core'
import { overheadForDateRange, sumBusinessExpensesInRange } from '@/lib/expense-totals'
import { toCoreBusinessExpenses, toCoreJobs } from '@/lib/to-core-job'
import type { DeskExpense, DeskJob } from '@/lib/types'

export type MoneyRangeKey = DateRangeKey

function inDateWindow(isoDay: string, start: Date, end: Date): boolean {
  const d = new Date(`${isoDay.slice(0, 10)}T12:00:00`)
  return d >= start && d <= end
}

export type MoneyPlSummary = {
  revenue: number
  expenses: number
  netProfit: number
  jobCount: number
  avgJob: number
  receiptExpenseCount: number
}

export function plToSummary(
  report: PLReport,
  expenses: DeskExpense[],
  start: Date,
  end: Date,
): MoneyPlSummary {
  let receiptExpenseCount = 0
  for (const exp of expenses) {
    if (inDateWindow(exp.date, start, end)) receiptExpenseCount += 1
  }
  return {
    revenue: report.revenue,
    expenses: report.totalExpenses,
    netProfit: report.netProfit,
    jobCount: report.jobCount,
    avgJob: report.jobCount > 0 ? Math.round(report.revenue / report.jobCount) : 0,
    receiptExpenseCount,
  }
}

/** P&L bundle — mirrors mobile Business tab using rinse-core date windows. */
export function getDeskMoneyBundle(
  jobs: DeskJob[],
  expenses: DeskExpense[],
  overheadItems: OverheadExpense[],
  range: MoneyRangeKey,
  now = new Date(),
): { current: PLReport; prior: PLReport; bounds: { start: Date; end: Date } } {
  const coreJobs = toCoreJobs(jobs)
  const bizRows = toCoreBusinessExpenses(expenses)
  const { start, end } = reportBoundsFor(range, coreJobs, bizRows, now)
  const prior = priorRangeFor(range, now)

  const current = computePLReportForDates(
    coreJobs,
    start,
    end,
    overheadForDateRange(overheadItems, start, end),
    sumBusinessExpensesInRange(bizRows, start, end),
  )
  const priorReport = computePLReportForDates(
    coreJobs,
    prior.start,
    prior.end,
    overheadForDateRange(overheadItems, prior.start, prior.end),
    sumBusinessExpensesInRange(bizRows, prior.start, prior.end),
  )

  return { current, prior: priorReport, bounds: { start, end } }
}

export function reportBoundsForDesk(
  range: MoneyRangeKey,
  jobs: DeskJob[],
  expenses: DeskExpense[],
  now = new Date(),
): { start: Date; end: Date } {
  const coreJobs = toCoreJobs(jobs)
  const bizRows = toCoreBusinessExpenses(expenses)
  return reportBoundsFor(range, coreJobs, bizRows, now)
}
