import {
  formatScheduledLabel,
  mapJobStatusForDisplay,
  netProfit,
  totalExpenses,
} from '../calculations'
import { formatJobsDashboardCSV, type JobExportRow, type JobExportSummary } from '../jobs-dashboard-csv'
import type {
  DashboardKpis,
  Invoice,
  Job,
  JobWithRelations,
  RecentJobRow,
  WeekDay,
} from '../types'
import type { DateRangeKey } from './reports'

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
      expenses[e.category] += e.amount
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

export function computeJobsExportData(
  jobs: Job[],
  range: DateRangeKey,
  labelResolver: (job: Job) => { client: string; pkg: string }
): { rows: JobExportRow[]; summary: JobExportSummary } {
  const { start, end } = rangeFor(range)
  const filtered = jobs.filter((j) => jobInRange(j, start, end))
  const rows = filtered
    .map((j) => {
      const { client, pkg } = labelResolver(j)
      return {
        date: j.date,
        client,
        pkg,
        revenue: j.revenue,
        tip: j.tip,
        expenses: totalExpenses(j),
        netProfit: netProfit(j),
        status: j.status,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
  const totalRevenue = rows.reduce((s, r) => s + r.revenue + r.tip, 0)
  const totalExpensesSum = rows.reduce((s, r) => s + r.expenses, 0)
  const netProfitSum = rows.reduce((s, r) => s + r.netProfit, 0)
  return {
    rows,
    summary: {
      totalRevenue,
      totalExpenses: totalExpensesSum,
      netProfit: netProfitSum,
      jobCount: rows.length,
    },
  }
}

export type { JobExportRow, JobExportSummary }

export interface JobsCSVOptions {
  periodLabel?: string
  periodRange?: string
  businessName?: string
  priorRevenue?: number
}

export function formatJobsExportCSV(
  rows: JobExportRow[],
  summary: JobExportSummary,
  options: JobsCSVOptions = {}
): string {
  return formatJobsDashboardCSV(rows, summary, {
    businessName: options.businessName,
    periodLabel: options.periodLabel,
    periodRange: options.periodRange,
    priorRevenue: options.priorRevenue,
  })
}

export function computeJobsCSV(
  jobs: Job[],
  range: DateRangeKey,
  labelResolver: (job: Job) => { client: string; pkg: string },
  options: JobsCSVOptions = {}
): string {
  const { rows, summary } = computeJobsExportData(jobs, range, labelResolver)
  return formatJobsExportCSV(rows, summary, {
    periodLabel: options.periodLabel ?? range,
    periodRange: options.periodRange,
    businessName: options.businessName,
    priorRevenue: options.priorRevenue,
  })
}

export function computeDashboard(
  jobs: JobWithRelations[],
  invoices: Invoice[],
  mtdOverhead = 0,
  mtdBusiness = 0
): { kpis: DashboardKpis; recentJobs: RecentJobRow[]; jobsToday: number; priorRevenueMtd: number } {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  const todayStr = now.toISOString().split('T')[0]
  const priorMonth = priorRangeFor('this_month', now)

  const mtdPl = computePLReportForDates(jobs, monthStart, monthEnd, mtdOverhead, mtdBusiness)
  const priorMtdJobs = jobs.filter((j) => jobInRange(j, priorMonth.start, priorMonth.end))
  const priorRevenueMtd = priorMtdJobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  const outstandingInvoices = invoices.filter(
    (i) => i.status === 'sent' || i.status === 'partial' || i.status === 'overdue'
  )
  const outstanding = outstandingInvoices.reduce((s, i) => s + i.balance_due, 0)

  const jobsThisWeek = jobs.filter((j) => {
    const d = new Date(j.date + 'T12:00:00')
    return d >= weekStart && d <= weekEnd
  }).length

  const todayJobs = jobs.filter((j) => j.date === todayStr)
  const jobsToday = todayJobs.length
  const revenueToday = todayJobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  const recentJobs: RecentJobRow[] = [...jobs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((j) => {
      const status = mapJobStatusForDisplay(j)
      return {
        id: j.id,
        clientName: j.client?.name ?? 'Unknown',
        package: j.package?.name ?? '—',
        packageId: j.package_id,
        vehicleType: j.vehicle_type.charAt(0).toUpperCase() + j.vehicle_type.slice(1),
        locationType: j.location_type,
        revenue: j.revenue,
        profit: netProfit(j),
        status,
        scheduledDate: status === 'scheduled' ? formatScheduledLabel(j.date, j.start_time) : undefined,
        startTime: j.start_time,
        clientAddress: j.client?.address,
        jobStatus: j.status,
      }
    })

  return {
    kpis: {
      revenueMtd: mtdPl.revenue,
      expensesMtd: mtdPl.totalExpenses,
      profitMtd: mtdPl.netProfit,
      marginMtd: mtdPl.marginPct,
      outstanding,
      outstandingInvoiceCount: outstandingInvoices.length,
      revenueToday,
      jobsThisWeek,
    },
    recentJobs,
    jobsToday,
    priorRevenueMtd,
  }
}

export function computeWeekDays(jobs: Job[]): WeekDay[] {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const todayStr = now.toISOString().split('T')[0]
  const days: WeekDay[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      jobCount: jobs.filter((j) => j.date === dateStr).length,
    })
  }
  return days
}

export function computeJobsForDate(jobs: JobWithRelations[], date: string): RecentJobRow[] {
  return jobs
    .filter((j) => j.date === date)
    .map((j) => {
      const status = mapJobStatusForDisplay(j)
      return {
        id: j.id,
        clientName: j.client?.name ?? 'Unknown',
        package: j.package?.name ?? '—',
        packageId: j.package_id,
        vehicleType: j.vehicle_type.charAt(0).toUpperCase() + j.vehicle_type.slice(1),
        locationType: j.location_type,
        revenue: j.revenue,
        profit: netProfit(j),
        status,
        scheduledDate: status === 'scheduled' ? formatScheduledLabel(j.date, j.start_time) : undefined,
        startTime: j.start_time,
        clientAddress: j.client?.address,
        jobStatus: j.status,
      }
    })
}
