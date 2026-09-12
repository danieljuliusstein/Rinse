import { activeJobs, netProfit } from './calculations'
import type { Job } from './types'

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

const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/

/**
 * PocketBase / mirror may return full ISO timestamps in `date`. Extract the
 * `YYYY-MM-DD` prefix. Inlined in core so it does not depend on any app module.
 */
function normalizeJobDate(dateStr: string): string {
  const match = dateStr.match(ISO_DATE_PREFIX)
  return match ? match[1] : dateStr
}

/** Parse job / expense date-only (handles PocketBase `YYYY-MM-DD HH:mm:ss.SSSZ`). */
function parseReportDate(dateStr: string): Date {
  const day = normalizeJobDate(dateStr)
  return new Date(`${day}T12:00:00`)
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
      // Wide default for job filtering; callers should clamp overhead via
      // `lifetimeActivityStart` so recurring costs are not prorated from 2000.
      return { start: new Date(2000, 0, 1), end: now }
  }
}

/**
 * Earliest calendar day with jobs or business expenses — used to clamp lifetime
 * overhead so monthly costs are not multiplied from year 2000.
 */
export function lifetimeActivityStart(
  jobs: Array<{ date: string }>,
  businessExpenses: Array<{ date: string }> = [],
  now = new Date(),
): Date {
  let earliest: string | null = null
  for (const j of jobs) {
    const day = normalizeJobDate(j.date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && (earliest == null || day < earliest)) earliest = day
  }
  for (const e of businessExpenses) {
    const day = normalizeJobDate(e.date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && (earliest == null || day < earliest)) earliest = day
  }
  if (!earliest) return startOfMonth(now)
  return new Date(`${earliest}T00:00:00`)
}

/** Like `rangeFor`, but lifetime start clamps to first job/expense day (not year 2000). */
export function reportBoundsFor(
  key: DateRangeKey,
  jobs: Array<{ date: string }> = [],
  businessExpenses: Array<{ date: string }> = [],
  now = new Date(),
): { start: Date; end: Date } {
  const bounds = rangeFor(key, now)
  if (key !== 'lifetime') return bounds
  const activity = lifetimeActivityStart(jobs, businessExpenses, now)
  return { start: activity, end: bounds.end }
}

export function jobInRange(job: Job, start: Date, end: Date): boolean {
  const d = parseReportDate(job.date)
  if (Number.isNaN(d.getTime())) return false
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
  // Authoritative cancelled-job exclusion: filter out cancelled jobs BEFORE
  // applying the date range, regardless of what the caller passes in
  // (Requirement 1.1). This is the single source of truth for the exclusion.
  const active = activeJobs(jobs)
  const filtered = active.filter((j) => jobInRange(j, start, end))

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

export function getPLReportBundle(
  jobs: Job[],
  range: DateRangeKey,
  overhead = 0,
  businessExpenses = 0,
  priorOverhead = 0,
  priorBusinessExpenses = 0
) {
  const current = computePLReport(jobs, range, overhead, businessExpenses)
  const priorRange = priorRangeFor(range)
  const prior = computePLReportForDates(
    jobs,
    priorRange.start,
    priorRange.end,
    priorOverhead,
    priorBusinessExpenses
  )
  return { current, prior }
}
