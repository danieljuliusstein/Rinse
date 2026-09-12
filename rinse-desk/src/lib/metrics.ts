import type { OverheadExpense } from '@/lib/rinse-core'
import { isOutboundEmailActivity } from '@/lib/activity-meta'
import type { MoneyRangeKey } from '@/lib/desk-money'
import { reportBoundsForDesk } from '@/lib/desk-money'
import { overheadForDateRange } from '@/lib/expense-totals'
import type {
  DeskActivity,
  DeskCampaign,
  DeskClient,
  DeskExpense,
  DeskInvoice,
  DeskJob,
  DeskLead,
  DeskPackage,
} from '@/lib/types'

export type { MoneyPlSummary, MoneyRangeKey } from '@/lib/desk-money'
export { getDeskMoneyBundle, plToSummary, reportBoundsForDesk } from '@/lib/desk-money'

export function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n)
}

export function moneyCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return money(n)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return (name.slice(0, 2) || '?').toUpperCase()
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function unpaidAr(invoices: DeskInvoice[]): number {
  return invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue' || i.balance_due > 0)
    .reduce((sum, i) => sum + Math.max(i.balance_due, i.status === 'paid' ? 0 : i.total - i.amount_paid), 0)
}

export function paidRevenueInRange(invoices: DeskInvoice[], jobs: DeskJob[], from: string, to: string): number {
  const fromInv = invoices
    .filter((i) => {
      const d = (i.paid_at ?? i.created ?? '').slice(0, 10)
      return i.status === 'paid' && d >= from && d <= to
    })
    .reduce((s, i) => s + i.total, 0)
  if (fromInv > 0) return fromInv
  return jobs
    .filter((j) => j.status === 'paid' && j.date >= from && j.date <= to)
    .reduce((s, j) => s + j.revenue + j.tip, 0)
}

export function tipsInRange(invoices: DeskInvoice[], jobs: DeskJob[], from: string, to: string): number {
  const fromInv = invoices
    .filter((i) => {
      const d = (i.paid_at ?? i.created ?? '').slice(0, 10)
      return i.status === 'paid' && d >= from && d <= to
    })
    .reduce((s, i) => s + i.tip, 0)
  if (fromInv > 0) return fromInv
  return jobs.filter((j) => j.date >= from && j.date <= to).reduce((s, j) => s + j.tip, 0)
}

export function expensesInRange(expenses: DeskExpense[], from: string, to: string): number {
  return expenses.filter((e) => e.date >= from && e.date <= to).reduce((s, e) => s + e.amount, 0)
}

export function serviceMix(
  jobs: DeskJob[],
  packages: DeskPackage[],
  from: string,
  to: string,
): { name: string; revenue: number }[] {
  const map = new Map<string, number>()
  for (const job of jobs) {
    if (job.date < from || job.date > to) continue
    if (!['completed', 'invoiced', 'paid'].includes(job.status)) continue
    const name = job.packageName || packages.find((p) => p.id === job.package_id)?.name || 'Service'
    map.set(name, (map.get(name) ?? 0) + job.revenue + job.tip)
  }
  return [...map.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function buildMonthSeries(
  invoices: DeskInvoice[],
  expenses: DeskExpense[],
  jobs: DeskJob[],
): { month: string; revenue: number; expenses: number; tips: number }[] {
  const map = new Map<string, { month: string; revenue: number; expenses: number; tips: number }>()
  const ensure = (key: string) => {
    if (!map.has(key)) {
      const [y, m] = key.split('-')
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'short' })
      map.set(key, { month: label, revenue: 0, expenses: 0, tips: 0 })
    }
    return map.get(key)!
  }

  // Always show a full trailing 12-month window (like a standard finance dashboard)
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ensure(key)
  }

  for (const inv of invoices) {
    const key = (inv.paid_at ?? inv.created ?? '').slice(0, 7)
    if (key.length < 7 || !map.has(key)) continue
    const row = ensure(key)
    if (inv.status === 'paid') {
      row.revenue += inv.total
      row.tips += inv.tip
    }
  }

  for (const job of jobs) {
    const key = job.date.slice(0, 7)
    if (key.length < 7 || !map.has(key)) continue
    const row = ensure(key)
    if (!invoices.some((i) => i.job_id === job.id && i.status === 'paid')) {
      if (job.status === 'paid' || job.status === 'completed' || job.status === 'invoiced') {
        row.revenue += job.revenue + job.tip
        row.tips += job.tip
      }
    }
  }

  for (const exp of expenses) {
    const key = exp.date.slice(0, 7)
    if (key.length < 7 || !map.has(key)) continue
    ensure(key).expenses += exp.amount
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

export const MONEY_RANGE_CHIPS: { key: MoneyRangeKey; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
  { key: 'lifetime', label: 'Lifetime' },
]

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59)
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function moneyRangeFor(key: MoneyRangeKey, now = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (key) {
    case 'this_week':
      return { start: startOfWeek(now), end: endOfWeek(now) }
    case 'this_month':
      return { start: new Date(y, m, 1), end: endOfMonth(now) }
    case 'last_month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
    case 'this_year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) }
    case 'lifetime': {
      return { start: new Date(2000, 0, 1), end: now }
    }
  }
}

/** @deprecated Use `reportBoundsForDesk`. */
export function moneyBoundsFor(
  key: MoneyRangeKey,
  jobs: DeskJob[],
  expenses: DeskExpense[],
  now = new Date(),
): { start: Date; end: Date } {
  return reportBoundsForDesk(key, jobs, expenses, now)
}

function jobDayCosts(job: DeskJob): number {
  let total =
    Number(job.travel_cost ?? 0) +
    Number(job.equipment_depreciation ?? 0) +
    Number(job.marketing_cost ?? 0)
  for (const e of job.expenses ?? []) total += Number(e.amount ?? 0)
  return total
}

function inDateWindow(isoDay: string, start: Date, end: Date): boolean {
  const d = new Date(`${isoDay.slice(0, 10)}T12:00:00`)
  return d >= start && d <= end
}

export type MoneyChartPoint = {
  label: string
  revenue: number
  expenses: number
  net: number
  tip?: number
}

function emptyPoint(label: string): MoneyChartPoint {
  return { label, revenue: 0, expenses: 0, net: 0 }
}

/**
 * Chart buckets sized so labels stay readable and match KPI window:
 * week → daily (full Sun–Sat); month → weekly (full month);
 * year/lifetime → monthly (identical when all activity is in the current year).
 */
export function buildMoneyChartSeries(
  jobs: DeskJob[],
  expenses: DeskExpense[],
  overheadItems: OverheadExpense[],
  range: MoneyRangeKey,
  start: Date,
  end: Date,
): MoneyChartPoint[] {
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const to = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  if (to < from) return []

  if (range === 'this_week') {
    const map = new Map<string, MoneyChartPoint>()
    // Always 7 days for the selected week — do not clip to "today"
    // (that collapsed the chart to a single Sunday while KPIs still counted Mon–Sat jobs).
    for (let i = 0; i < 7; i++) {
      const d = addDays(from, i)
      map.set(toIsoLocal(d), emptyPoint(d.toLocaleDateString('en-US', { weekday: 'short' })))
    }
    fillDayBuckets(map, jobs, expenses, start, end)
    return spreadOverheadAcrossSeries(finalizeMap(map), overheadItems, start, end)
  }

  if (range === 'this_month' || range === 'last_month') {
    // Calendar weeks overlapping the month (readable W1… labels, full KPI window)
    const buckets: MoneyChartPoint[] = []
    let cursor = new Date(from)
    // Align back to week start (Sunday) but only accumulate days inside [from, to]
    cursor = startOfWeek(cursor)
    let weekIndex = 0
    while (cursor <= to) {
      const weekStart = new Date(cursor)
      const weekEnd = endOfWeek(cursor)
      const sliceStart = weekStart < from ? from : weekStart
      const sliceEnd = weekEnd > to ? to : weekEnd
      if (sliceStart <= to && sliceEnd >= from) {
        weekIndex += 1
        const label =
          range === 'last_month'
            ? `${sliceStart.getMonth() + 1}/${sliceStart.getDate()}`
            : `W${weekIndex}`
        const point = emptyPoint(label)
        const sliceEndInclusive = new Date(
          sliceEnd.getFullYear(),
          sliceEnd.getMonth(),
          sliceEnd.getDate(),
          23,
          59,
          59,
        )
        for (const job of jobs) {
          if (job.status === 'cancelled') continue
          const day = job.date.slice(0, 10)
          if (!inDateWindow(day, sliceStart, sliceEndInclusive)) continue
          if (!inDateWindow(day, start, end)) continue
          point.revenue += job.revenue + job.tip
          point.expenses += jobDayCosts(job)
        }
        for (const exp of expenses) {
          const day = exp.date.slice(0, 10)
          if (!inDateWindow(day, sliceStart, sliceEndInclusive)) continue
          if (!inDateWindow(day, start, end)) continue
          point.expenses += exp.amount
        }
        point.net = point.revenue - point.expenses
        buckets.push(point)
      }
      cursor = addDays(weekEnd, 1)
      if (weekIndex > 6) break // safety
    }
    return spreadOverheadAcrossSeries(
      buckets.length > 0 ? buckets : [emptyPoint('—')],
      overheadItems,
      start,
      end,
    )
  }

  // this_year / lifetime → monthly
  // (Same shape when all activity is in the current year — expected.)
  const now = new Date()
  const seriesEnd =
    range === 'this_year' && end > now
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : to
  const map = new Map<string, MoneyChartPoint>()
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  const last = new Date(seriesEnd.getFullYear(), seriesEnd.getMonth(), 1)
  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const label =
      range === 'lifetime' && from.getFullYear() !== seriesEnd.getFullYear()
        ? cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        : cursor.toLocaleString('en-US', { month: 'short' })
    map.set(key, emptyPoint(label))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const job of jobs) {
    if (job.status === 'cancelled') continue
    if (!inDateWindow(job.date, start, end)) continue
    const key = job.date.slice(0, 7)
    const row = map.get(key)
    if (!row) continue
    row.revenue += job.revenue + job.tip
    row.expenses += jobDayCosts(job)
  }
  for (const exp of expenses) {
    if (!inDateWindow(exp.date, start, end)) continue
    const key = exp.date.slice(0, 7)
    const row = map.get(key)
    if (row) row.expenses += exp.amount
  }
  const rows = finalizeMap(map)
  const firstActive = rows.findIndex((r) => r.revenue > 0 || r.expenses > 0)
  const series = firstActive <= 0 ? rows : rows.slice(firstActive)
  return spreadOverheadAcrossSeries(series, overheadItems, start, end)
}

function fillDayBuckets(
  map: Map<string, MoneyChartPoint>,
  jobs: DeskJob[],
  expenses: DeskExpense[],
  start: Date,
  end: Date,
) {
  for (const job of jobs) {
    if (job.status === 'cancelled') continue
    if (!inDateWindow(job.date, start, end)) continue
    const row = map.get(job.date.slice(0, 10))
    if (!row) continue
    row.revenue += job.revenue + job.tip
    row.expenses += jobDayCosts(job)
  }
  for (const exp of expenses) {
    if (!inDateWindow(exp.date, start, end)) continue
    const row = map.get(exp.date.slice(0, 10))
    if (row) row.expenses += exp.amount
  }
}

function spreadOverheadAcrossSeries(
  rows: MoneyChartPoint[],
  overheadItems: OverheadExpense[],
  start: Date,
  end: Date,
): MoneyChartPoint[] {
  if (rows.length === 0) return rows
  const overhead = overheadForDateRange(overheadItems, start, end)
  if (overhead <= 0) return rows
  const share = overhead / rows.length
  return rows.map((row) => ({
    ...row,
    expenses: row.expenses + share,
    net: row.revenue - (row.expenses + share),
  }))
}

function finalizeMap(map: Map<string, MoneyChartPoint>): MoneyChartPoint[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, r]) => ({ ...r, net: r.revenue - r.expenses }))
}

/** KPI / axis money — keep dollars readable (avoid $3.2K next to $264.65). */
export function moneyAxis(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 10_000) return moneyCompact(n)
  if (abs >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: abs % 1 === 0 ? 0 : 2,
  }).format(n)
}

export function sortJobsByRoute(jobs: DeskJob[]): DeskJob[] {
  return [...jobs].sort((a, b) => {
    const ao = a.route_order
    const bo = b.route_order
    if (ao != null && bo != null && ao !== bo) return ao - bo
    if (ao != null && bo == null) return -1
    if (ao == null && bo != null) return 1
    return (a.start_time || '').localeCompare(b.start_time || '') || a.id.localeCompare(b.id)
  })
}

export function contactType(client: DeskClient, all: DeskClient[]): 'Customer' | 'Partner' | 'Team Member' | 'Prospect' {
  if (client.parent_client_id) return 'Partner'
  if (all.some((c) => c.parent_client_id === client.id)) return 'Partner'
  if (client.lead_source && !client.tags?.length) return 'Prospect'
  return 'Customer'
}

export function membershipLabel(client: DeskClient): string {
  if (!client.membership_cadence || client.membership_cadence === 'none') return '—'
  if (client.membership_paused) return `${client.membership_cadence} (paused)`
  return client.membership_cadence
}

export function parentSubLabel(client: DeskClient, all: DeskClient[]): string {
  if (client.parent_client_id) {
    const parent = all.find((c) => c.id === client.parent_client_id)
    return `Sub · ${parent?.name ?? 'parent'}`
  }
  if (all.some((c) => c.parent_client_id === client.id)) return 'Parent'
  return 'Solo'
}

export function leadPipelinePct(leads: DeskLead[]) {
  const total = leads.length || 1
  return [
    { name: 'Inquiry', pct: Math.round((leads.filter((l) => l.stage === 'inquiry').length / total) * 100), color: '#22c55e' },
    { name: 'Quoted', pct: Math.round((leads.filter((l) => l.stage === 'quoted').length / total) * 100), color: '#f59e0b' },
    { name: 'Scheduled', pct: Math.round((leads.filter((l) => l.stage === 'booked').length / total) * 100), color: '#14b8a6' },
  ]
}

/** Campaign send totals + 1:1 outbound emails (excludes campaign Activities to avoid double-count). */
export function emailOutreachStats(campaigns: DeskCampaign[], activities: DeskActivity[]) {
  const emailCampaigns = campaigns.filter((c) => c.channel === 'email')
  const campaignSent = emailCampaigns.reduce((s, c) => s + (c.stats_sent || 0), 0)
  const opened = emailCampaigns.reduce((s, c) => s + (c.stats_opened || 0), 0)
  const clicked = emailCampaigns.reduce((s, c) => s + (c.stats_clicked || 0), 0)
  const oneToOne = activities.filter(
    (a) => isOutboundEmailActivity(a) && !a.subject.startsWith('Campaign:'),
  ).length
  const sent = campaignSent + oneToOne
  const openRate = campaignSent > 0 ? Math.round((opened / campaignSent) * 100) : 0
  const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0
  return {
    sent,
    opened,
    clicked,
    openRate,
    clickRate,
    campaignSent,
    oneToOne,
    campaignCount: emailCampaigns.length,
  }
}

/** Paid/completed job revenue; fall back to paid invoices when no won jobs exist. */
export function revenueWon(jobs: DeskJob[], invoices: DeskInvoice[]): { revenue: number; jobCount: number } {
  const wonJobs = jobs.filter((j) => j.status === 'paid' || j.status === 'completed')
  if (wonJobs.length > 0) {
    return {
      revenue: wonJobs.reduce((s, j) => s + j.revenue + j.tip, 0),
      jobCount: wonJobs.length,
    }
  }
  const fromInvoices = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  return { revenue: fromInvoices, jobCount: 0 }
}

export type RevenueRangeDays = 7 | 30 | 90

export type DailyRevenuePoint = {
  key: string
  label: string
  tooltipLabel: string
  daily: number
  avg: number
}

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function localDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Won revenue attributed per calendar day for a trailing window ending at `end` (inclusive). */
export function dailyRevenueSeries(
  jobs: DeskJob[],
  invoices: DeskInvoice[],
  dayCount: number,
  end: Date = new Date(),
): Omit<DailyRevenuePoint, 'avg'>[] {
  const today = startOfLocalDay(end)
  const points: Omit<DailyRevenuePoint, 'avg'>[] = []
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    points.push({
      key: localDayKey(d),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tooltipLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daily: 0,
    })
  }
  const byKey = new Map(points.map((p) => [p.key, p]))
  const countedJobIds = new Set<string>()

  for (const j of jobs) {
    if (!['paid', 'completed', 'invoiced'].includes(j.status)) continue
    const key = (j.date || '').slice(0, 10)
    const row = byKey.get(key)
    if (!row) continue
    row.daily += j.revenue + j.tip
    countedJobIds.add(j.id)
  }
  for (const inv of invoices) {
    if (inv.status !== 'paid') continue
    if (inv.job_id && countedJobIds.has(inv.job_id)) continue
    if (jobs.some((j) => j.id === inv.job_id && ['paid', 'completed', 'invoiced'].includes(j.status))) {
      continue
    }
    const d = (inv.paid_at ?? inv.created ?? '').slice(0, 10)
    const row = byKey.get(d)
    if (row) row.daily += inv.total
  }

  return points
}

export function revenueWonPeriod(
  jobs: DeskJob[],
  invoices: DeskInvoice[],
  dayCount: RevenueRangeDays | number,
  end: Date = new Date(),
): {
  series: DailyRevenuePoint[]
  revenue: number
  priorRevenue: number
  pctChange: number | null
  jobCount: number
  hasData: boolean
} {
  const seriesRaw = dailyRevenueSeries(jobs, invoices, dayCount, end)
  const revenue = seriesRaw.reduce((s, d) => s + d.daily, 0)
  const avg = dayCount > 0 ? Math.round((revenue / dayCount) * 10) / 10 : 0
  const series = seriesRaw.map((d) => ({ ...d, avg }))

  const priorEnd = startOfLocalDay(end)
  priorEnd.setDate(priorEnd.getDate() - dayCount)
  const priorRevenue = dailyRevenueSeries(jobs, invoices, dayCount, priorEnd).reduce((s, d) => s + d.daily, 0)

  const startKey = seriesRaw[0]?.key ?? ''
  const endKey = seriesRaw[seriesRaw.length - 1]?.key ?? ''
  const jobCount = jobs.filter(
    (j) =>
      (j.status === 'paid' || j.status === 'completed') &&
      j.date >= startKey &&
      j.date <= endKey,
  ).length

  let pctChange: number | null = null
  if (priorRevenue > 0) {
    pctChange = Math.round(((revenue - priorRevenue) / priorRevenue) * 100)
  } else if (revenue > 0) {
    pctChange = 100
  } else {
    pctChange = 0
  }

  return {
    series,
    revenue,
    priorRevenue,
    pctChange,
    jobCount,
    hasData: revenue > 0,
  }
}
