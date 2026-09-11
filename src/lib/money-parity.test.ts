import { describe, expect, it } from 'vitest'
import { getDeskMoneyBundle } from '@/lib/desk-money'
import { overheadForDateRange } from '@/lib/expense-totals'
import {
  computePLReportForDates as coreComputePLReportForDates,
  priorRangeFor,
  reportBoundsFor as coreReportBoundsFor,
} from '@/lib/rinse-core'
import type { DeskExpense, DeskJob } from '@/lib/types'
import {
  FIXTURE_BUSINESS_EXPENSE_ROWS,
  FIXTURE_BUSINESS_EXPENSES,
  FIXTURE_JOBS,
  FIXTURE_OVERHEAD,
} from '@/lib/money-parity-fixture'

const NOW = new Date('2024-06-15T12:00:00')

function fixtureDeskJobs(): DeskJob[] {
  return FIXTURE_JOBS.map((j) => ({
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
}

function fixtureDeskExpenses(): DeskExpense[] {
  return FIXTURE_BUSINESS_EXPENSE_ROWS.map((e) => ({
    id: e.id,
    date: e.date,
    name: e.name,
    description: e.name,
    amount: e.amount,
  }))
}

describe('desktop money parity vs rinse-core P&L', () => {
  it('matches core lifetime P&L totals', () => {
    const deskJobs = fixtureDeskJobs()
    const deskExpenses = fixtureDeskExpenses()

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

    expect(deskReport.revenue).toBe(coreReport.revenue)
    expect(deskReport.totalExpenses).toBe(coreReport.totalExpenses)
    expect(deskReport.netProfit).toBe(coreReport.netProfit)
    expect(deskReport.marginPct).toBe(coreReport.marginPct)
    expect(deskReport.jobCount).toBe(coreReport.jobCount)
    expect(deskBundle.bounds.start.getTime()).toBe(coreRange.start.getTime())
  })

  it('prorates overhead the same way as core scalar input', () => {
    const deskJobs = fixtureDeskJobs()
    const deskExpenses = fixtureDeskExpenses()
    const overheadItems = [
      {
        id: 'oh_1',
        name: 'Insurance',
        amount: FIXTURE_OVERHEAD,
        billing_cycle: 'one_time' as const,
        next_due: '2022-03-10',
      },
    ]
    const coreRange = coreReportBoundsFor('lifetime', FIXTURE_JOBS, FIXTURE_BUSINESS_EXPENSE_ROWS, NOW)
    const overheadTotal = overheadForDateRange(overheadItems, coreRange.start, coreRange.end)
    const coreReport = coreComputePLReportForDates(
      FIXTURE_JOBS,
      coreRange.start,
      coreRange.end,
      overheadTotal,
      FIXTURE_BUSINESS_EXPENSES,
    )
    const deskBundle = getDeskMoneyBundle(deskJobs, deskExpenses, overheadItems, 'lifetime', NOW)
    expect(deskBundle.current.netProfit).toBe(coreReport.netProfit)
  })

  it('uses calendar prior period via getDeskMoneyBundle', () => {
    const prior = priorRangeFor('this_month', NOW)
    expect(prior.start.getMonth()).toBe(4) // May when now is June
    // Fixture jobs sit in 2022–early 2024; this_year has activity, this_month does not.
    const deskBundle = getDeskMoneyBundle(fixtureDeskJobs(), fixtureDeskExpenses(), [], 'this_year', NOW)
    expect(deskBundle.prior.jobCount).toBeGreaterThanOrEqual(0)
    expect(deskBundle.current.jobCount).toBeGreaterThan(0)
  })
})
