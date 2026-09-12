import { describe, expect, it } from 'vitest'
import type { ExpenseLine, Job } from './types'
import {
  computePLReportForDates,
  rangeFor,
  reportBoundsFor,
} from './reports'

/**
 * Build a valid `Job` fixture with every required field populated. Callers
 * override only the money / status / date bits relevant to a given assertion.
 */
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: overrides.id ?? 'job-' + Math.random().toString(36).slice(2),
    date: '2024-06-10',
    hours_worked: 2,
    location_type: 'mobile',
    package_id: 'pkg-1',
    vehicle_type: 'sedan',
    client_id: 'client-1',
    status: 'completed',
    revenue: 0,
    tip: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
    ...overrides,
  }
}

const supplies = (amount: number): ExpenseLine[] => [
  { category: 'supplies', description: 'soap', amount },
]

describe('reports — cancelled-job exclusion (Req 1.1)', () => {
  const start = new Date(2024, 5, 1) // Jun 1 2024
  const end = new Date(2024, 5, 30, 23, 59, 59) // Jun 30 2024

  it('excludes a cancelled job even when passed directly into computePLReportForDates', () => {
    const activeA = makeJob({
      id: 'a',
      date: '2024-06-05',
      revenue: 200,
      tip: 20,
      expenses: supplies(30),
    })
    const activeB = makeJob({
      id: 'b',
      date: '2024-06-15',
      revenue: 300,
      tip: 40,
      travel_cost: 25,
    })
    const cancelled = makeJob({
      id: 'c',
      date: '2024-06-20',
      status: 'cancelled',
      revenue: 999,
      tip: 111,
      expenses: supplies(500),
      travel_cost: 300,
      marketing_cost: 200,
      equipment_depreciation: 100,
    })

    const withCancelled = computePLReportForDates(
      [activeA, activeB, cancelled],
      start,
      end,
    )
    const activeOnly = computePLReportForDates([activeA, activeB], start, end)

    // The internal activeJobs guard must drop the cancelled job.
    expect(withCancelled.revenue).toBe(activeOnly.revenue)
    expect(withCancelled.netProfit).toBe(activeOnly.netProfit)
    expect(withCancelled.totalExpenses).toBe(activeOnly.totalExpenses)
    expect(withCancelled.jobCount).toBe(activeOnly.jobCount)

    // Concrete expectations for the active-only result.
    // revenue = (200+20) + (300+40) = 560
    expect(withCancelled.revenue).toBe(560)
    // jobCount counts only the two active jobs
    expect(withCancelled.jobCount).toBe(2)
    // netProfit = 560 - (30 supplies + 25 travel) = 505
    expect(withCancelled.netProfit).toBe(505)
    // totalExpenses = supplies 30 + travel 25 = 55
    expect(withCancelled.totalExpenses).toBe(55)
  })
})

describe('reports — job-based revenue formula (Req 3.1)', () => {
  const start = new Date(2024, 5, 1)
  const end = new Date(2024, 5, 30, 23, 59, 59)

  it('revenue equals sum of revenue + tip over non-cancelled in-range jobs', () => {
    const jobs = [
      makeJob({ id: 'a', date: '2024-06-02', revenue: 100, tip: 10 }),
      makeJob({ id: 'b', date: '2024-06-12', revenue: 250, tip: 0 }),
      makeJob({ id: 'c', date: '2024-06-28', revenue: 75, tip: 25 }),
      // Out of range — excluded by date.
      makeJob({ id: 'd', date: '2024-07-01', revenue: 500, tip: 50 }),
      // Cancelled — excluded by status.
      makeJob({ id: 'e', date: '2024-06-15', status: 'cancelled', revenue: 400, tip: 40 }),
    ]

    const report = computePLReportForDates(jobs, start, end)

    // (100+10) + (250+0) + (75+25) = 460
    expect(report.revenue).toBe(460)
    expect(report.jobCount).toBe(3)
  })
})

describe('reports — range boundaries for all keys (Req 3.3)', () => {
  // Jun 15 2024 is a Saturday (getDay() === 6), making this_week deterministic.
  const now = new Date(2024, 5, 15)

  it('now is a Saturday (guards this_week determinism)', () => {
    expect(now.getDay()).toBe(6)
  })

  it('this_week: Sun Jun 9 -> Sat Jun 15', () => {
    const { start, end } = rangeFor('this_week', now)
    expect(start.getTime()).toBe(new Date(2024, 5, 9).getTime())
    expect(end.getTime()).toBe(new Date(2024, 5, 15, 23, 59, 59).getTime())
  })

  it('this_month: Jun 1 -> Jun 30', () => {
    const { start, end } = rangeFor('this_month', now)
    expect(start.getTime()).toBe(new Date(2024, 5, 1).getTime())
    expect(end.getTime()).toBe(new Date(2024, 5, 30, 23, 59, 59).getTime())
  })

  it('last_month: May 1 -> May 31', () => {
    const { start, end } = rangeFor('last_month', now)
    expect(start.getTime()).toBe(new Date(2024, 4, 1).getTime())
    expect(end.getTime()).toBe(new Date(2024, 5, 0, 23, 59, 59).getTime())
    // Explicit: May 31 2024
    expect(end.getTime()).toBe(new Date(2024, 4, 31, 23, 59, 59).getTime())
  })

  it('this_year: Jan 1 -> Dec 31', () => {
    const { start, end } = rangeFor('this_year', now)
    expect(start.getTime()).toBe(new Date(2024, 0, 1).getTime())
    expect(end.getTime()).toBe(new Date(2024, 11, 31, 23, 59, 59).getTime())
  })

  it('lifetime: rangeFor starts at year 2000 (unclamped)', () => {
    const { start, end } = rangeFor('lifetime', now)
    expect(start.getTime()).toBe(new Date(2000, 0, 1).getTime())
    expect(end.getTime()).toBe(now.getTime())
  })

  it('lifetime: reportBoundsFor clamps start to earliest activity day', () => {
    const earliestDay = '2023-03-04'
    const jobs = [
      makeJob({ id: 'a', date: earliestDay, revenue: 100 }),
      makeJob({ id: 'b', date: '2023-09-20', revenue: 100 }),
    ]
    const businessExpenses = [{ date: '2023-06-01' }]

    const { start, end } = reportBoundsFor('lifetime', jobs, businessExpenses, now)
    // Clamped to first activity day (NOT year 2000).
    expect(start.getTime()).toBe(new Date(`${earliestDay}T00:00:00`).getTime())
    // End still tracks rangeFor lifetime end (now).
    expect(end.getTime()).toBe(now.getTime())

    // Sanity: this differs from the unclamped rangeFor lifetime start.
    expect(rangeFor('lifetime', now).start.getTime()).toBe(new Date(2000, 0, 1).getTime())
  })

  it('lifetime: reportBoundsFor with no activity clamps to start-of-month of now', () => {
    const { start } = reportBoundsFor('lifetime', [], [], now)
    // Start-of-month of Jun 15 2024 -> Jun 1 2024.
    expect(start.getTime()).toBe(new Date(2024, 5, 1).getTime())
  })
})
