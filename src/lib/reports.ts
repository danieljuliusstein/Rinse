import { netProfit } from '@rinse/core'
import type { Job } from '@rinse/core'

export type DateRangeKey = 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'lifetime'

export interface PLReport {
  revenue: number
  expenses: {
    supplies: number
    travel: number
    equipment: number
    marketing: number
    labor: number
    overhead: number
    business: number
    other: number
  }
  totalExpenses: number
  netProfit: number
  marginPct: number
  jobCount: number
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59)
}

export function rangeFor(key: DateRangeKey, now = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (key) {
    case 'this_week': {
      const start = startOfWeek(now)
      const end = endOfWeek(now)
      return { start, end }
    }
    case 'this_month':
      return { start: new Date(y, m, 1), end: endOfMonth(now) }
    case 'last_month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
    case 'this_year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) }
    case 'lifetime':
      return { start: new Date(2000, 0, 1), end: now }
  }
}

export function jobInRange(job: Job, start: Date, end: Date): boolean {
  const d = new Date(job.date + 'T12:00:00')
  return d >= start && d <= end
}

export function priorRangeFor(key: DateRangeKey, now = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (key) {
    case 'this_month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
    case 'last_month':
      return { start: new Date(y, m - 2, 1), end: new Date(y, m - 1, 0, 23, 59, 59) }
    case 'this_week': {
      const thisStart = startOfWeek(now)
      const prevEnd = new Date(thisStart.getFullYear(), thisStart.getMonth(), thisStart.getDate() - 1, 23, 59, 59)
      const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() - 6)
      return { start: prevStart, end: prevEnd }
    }
    case 'this_year':
      return { start: new Date(y - 1, 0, 1), end: new Date(y - 1, 11, 31, 23, 59, 59) }
    case 'lifetime':
      return { start: new Date(y - 1, 0, 1), end: new Date(y - 1, 11, 31, 23, 59, 59) }
  }
}

export function computePLReportForDates(
  jobs: Job[],
  start: Date,
  end: Date,
  overhead = 0,
  businessExpenses = 0
): PLReport {
  const filtered = jobs.filter((j) => jobInRange(j, start, end))

  const expenses = {
    supplies: 0,
    travel: 0,
    equipment: 0,
    marketing: 0,
    labor: 0,
    overhead: 0,
    business: 0,
    other: 0,
  }
  let revenue = 0
  let profit = 0

  for (const job of filtered) {
    revenue += job.revenue + job.tip
    profit += netProfit(job)
    for (const e of job.expenses) {
      const cat = e.category as keyof typeof expenses
      if (cat in expenses) expenses[cat] += e.amount
      else expenses.other += e.amount
    }
    expenses.travel += job.travel_cost
    expenses.equipment += job.equipment_depreciation
    expenses.marketing += job.marketing_cost
  }

  expenses.overhead = overhead
  expenses.business = businessExpenses
  profit -= overhead + businessExpenses

  const totalExp = Object.values(expenses).reduce((s, v) => s + v, 0)
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

  return {
    revenue,
    expenses,
    totalExpenses: totalExp,
    netProfit: profit,
    marginPct,
    jobCount: filtered.length,
  }
}

export function computePLReport(
  jobs: Job[],
  range: DateRangeKey,
  overhead = 0,
  businessExpenses = 0
): PLReport {
  const { start, end } = rangeFor(range)
  return computePLReportForDates(jobs, start, end, overhead, businessExpenses)
}

export function getPLReportBundle(jobs: Job[], range: DateRangeKey) {
  const current = computePLReport(jobs, range)
  const priorRange = priorRangeFor(range)
  const prior = computePLReportForDates(jobs, priorRange.start, priorRange.end)
  return { current, prior }
}

export const REPORT_FILTER_CHIPS: { key: DateRangeKey; labelKey: string }[] = [
  { key: 'this_week', labelKey: 'business.ranges.this_week' },
  { key: 'this_month', labelKey: 'business.ranges.this_month' },
  { key: 'last_month', labelKey: 'business.ranges.last_month' },
  { key: 'this_year', labelKey: 'business.ranges.this_year' },
  { key: 'lifetime', labelKey: 'business.ranges.lifetime' },
]
