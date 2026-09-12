import type { PLReport } from './api/aggregates'
import type { DateRangeKey } from './api/reports'
import { fmtSigned } from './calculations'

export const MARGIN_TARGET_PCT = 55

export const EXPENSE_ORDER: (keyof PLReport['expenses'])[] = [
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'overhead',
  'business',
  'other',
]

export const EXPENSE_LABELS: Record<keyof PLReport['expenses'], string> = {
  supplies: 'Supplies',
  travel: 'Travel',
  equipment: 'Equipment',
  marketing: 'Marketing',
  labor: 'Labor',
  overhead: 'Overhead',
  business: 'Business expenses',
  other: 'Other',
}

export const REPORT_FILTER_CHIPS: { key: DateRangeKey; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
  { key: 'lifetime', label: 'All time' },
]

export function plProgressPeriodLabel(range: DateRangeKey): string {
  switch (range) {
    case 'this_week':
      return 'THIS WEEK'
    case 'this_month':
      return 'THIS MONTH'
    case 'last_month':
      return 'LAST MONTH'
    case 'this_year':
      return 'THIS YEAR'
    case 'lifetime':
      return 'ALL TIME'
  }
}

export interface PLProgressBar {
  name: string
  value: number
  color: string
  highlight: boolean
  isExpense: boolean
  isProfit?: boolean
  isLoss?: boolean
}

export function formatKpiNetProfit(n: number): string {
  return fmtSigned(n, 0)
}

export function formatBreakdownNetProfit(n: number): string {
  return fmtSigned(n, 2)
}

export function marginPillClass(marginPct: number): string {
  return marginPct < 0 ? 'reports-margin-pill reports-margin-pill--loss' : 'reports-margin-pill reports-margin-pill--pos'
}

export function barWidthPct(value: number, revenue: number): { width: number; overflow: number } {
  if (revenue <= 0) return { width: 0, overflow: 0 }
  const width = Math.min((Math.abs(value) / revenue) * 100, 100)
  const overflow = Math.max(0, value - revenue)
  return { width, overflow }
}

export function formatPct(value: number, revenue: number): string {
  if (revenue === 0) return '—'
  return `${Math.round((value / revenue) * 100)}%`
}

export function formatPctSigned(value: number, revenue: number): string {
  if (revenue === 0) return '—'
  const pct = Math.round((value / revenue) * 100)
  if (pct < 0) return `-${Math.abs(pct)}%`
  return `${pct}%`
}

export function formatOverflowAmount(expense: number, revenue: number): string {
  const over = expense - revenue
  return over.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function formatMarginPill(marginPct: number): string {
  const rounded = Math.round(marginPct)
  if (rounded < 0) return `-${Math.abs(rounded)}%`
  return `${rounded}%`
}

export function formatTotalExpensesAmount(total: number): string {
  if (total === 0) return fmtSigned(0, 2)
  return '-' + fmtSigned(total, 2)
}

export interface ExpenseBreakdownRow {
  key: keyof PLReport['expenses']
  label: string
  amount: number
  pctOfTotal: number
  color: string
}

export interface ComparisonBarRow {
  label: string
  amount: number
  widthPct: number
  color: string
}

/** Expense slice colors — muted, not alarm red. */
export const EXPENSE_BREAKDOWN_COLORS: Record<keyof PLReport['expenses'], string> = {
  supplies: '#60a5fa',
  travel: '#a78bfa',
  equipment: '#fbbf24',
  marketing: '#f472b6',
  labor: '#34d399',
  overhead: '#94a3b8',
  business: '#fb923c',
  other: '#78716c',
}

export function formatNetProfitLabel(netProfit: number): string {
  return netProfit < 0 ? 'Net loss' : 'Net profit'
}

export function formatExpensePctOfTotal(amount: number, totalExpenses: number): string {
  if (totalExpenses <= 0) return '0%'
  return `${Math.round((amount / totalExpenses) * 100)}%`
}

export function buildExpenseBreakdown(report: PLReport): ExpenseBreakdownRow[] {
  const { expenses, totalExpenses } = report
  return EXPENSE_ORDER.map((key) => ({
    key,
    label: EXPENSE_LABELS[key],
    amount: expenses[key],
    pctOfTotal: totalExpenses > 0 ? (expenses[key] / totalExpenses) * 100 : 0,
    color: EXPENSE_BREAKDOWN_COLORS[key],
  }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function buildComparisonBars(report: PLReport): ComparisonBarRow[] {
  const { revenue, totalExpenses } = report
  const max = Math.max(revenue, totalExpenses, 1)
  return [
    {
      label: 'Revenue',
      amount: revenue,
      widthPct: (revenue / max) * 100,
      color: '#22c55e',
    },
    {
      label: 'Expenses',
      amount: totalExpenses,
      widthPct: (totalExpenses / max) * 100,
      color: '#6b7280',
    },
  ]
}

export function shouldShowLeadSourceReport(
  leadSourceCount: number,
  jobCount: number
): boolean {
  if (jobCount < 3) return false
  if (leadSourceCount <= 1) return false
  return true
}

export function buildPLProgressBars(report: PLReport): {
  revenue: number
  expenseBars: PLProgressBar[]
  totalExpenseBar: PLProgressBar
  profitBar: PLProgressBar
} {
  const { revenue, expenses, netProfit, totalExpenses } = report

  const expenseBars: PLProgressBar[] = EXPENSE_ORDER.map((key) => ({
    name: EXPENSE_LABELS[key],
    value: expenses[key],
    color: '#e06060',
    highlight: false,
    isExpense: true,
  })).filter((bar) => bar.value > 0)

  const loss = netProfit < 0

  return {
    revenue,
    expenseBars,
    totalExpenseBar: {
      name: 'Total expenses',
      value: totalExpenses,
      color: totalExpenses > 0 ? '#e06060' : '#555',
      highlight: true,
      isExpense: true,
    },
    profitBar: {
      name: 'Net profit',
      value: netProfit,
      color: loss ? '#e06060' : '#22c55e',
      highlight: true,
      isExpense: false,
      isProfit: true,
      isLoss: loss,
    },
  }
}

export interface ReportDeltas {
  revenuePct: number
  profitPct: number
  expenseDollar: number
  marginPct: number
}

/** Each bar is [bottom, top] on the y-axis. vals are positive heights for tooltips. */
export interface WaterfallData {
  ranges: [number, number][]
  starts: number[]
  vals: number[]
  colors: string[]
  labels: string[]
  yMax: number
}

export function percentChange(current: number, prior: number): number {
  if (prior === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prior) / prior) * 100)
}

export function dollarChange(current: number, prior: number): number {
  return Math.round(current - prior)
}

export function computeDeltas(current: PLReport, prior: PLReport): ReportDeltas {
  return {
    revenuePct: percentChange(current.revenue, prior.revenue),
    profitPct: percentChange(current.netProfit, prior.netProfit),
    expenseDollar: dollarChange(current.totalExpenses, prior.totalExpenses),
    marginPct: percentChange(current.marginPct, prior.marginPct),
  }
}

function priorPeriodLabel(range: DateRangeKey): string {
  if (range === 'this_week') return 'last wk.'
  if (range === 'this_year') return 'last yr.'
  return 'last mo.'
}

export function formatPercentDelta(
  current: number,
  prior: number,
  range: DateRangeKey
): string {
  if (prior === 0) return current === 0 ? '—' : 'New'
  const val = Math.round(((current - prior) / prior) * 100)
  const arrow = val >= 0 ? '↑' : '↓'
  const period = priorPeriodLabel(range)
  return `${arrow} ${Math.abs(val)}% vs ${period}`
}

export function formatDollarDelta(
  current: number,
  prior: number,
  range: DateRangeKey
): string {
  if (prior === 0) return current === 0 ? '—' : 'New'
  const val = Math.round(current - prior)
  const arrow = val >= 0 ? '↑' : '↓'
  const period = priorPeriodLabel(range)
  return `${arrow} $${Math.abs(val).toLocaleString()} vs ${period}`
}

export function formatDelta(val: number, type: 'percent' | 'dollar', range: DateRangeKey): string {
  const arrow = val >= 0 ? '↑' : '↓'
  const period = priorPeriodLabel(range)
  if (type === 'percent') return `${arrow} ${Math.abs(val)}% vs ${period}`
  return `${arrow} $${Math.abs(val).toLocaleString()} vs ${period}`
}

export function deltaClass(
  val: number,
  kind: 'revenue' | 'profit' | 'expense' | 'margin'
): 'reports-delta--pos' | 'reports-delta--neg' | 'reports-delta--neutral' {
  if (kind === 'expense') return val > 0 ? 'reports-delta--neg' : val < 0 ? 'reports-delta--pos' : 'reports-delta--neutral'
  return val >= 0 ? 'reports-delta--pos' : 'reports-delta--neg'
}

export function percentDeltaClass(
  current: number,
  prior: number,
  kind: 'revenue' | 'profit'
): 'reports-delta--pos' | 'reports-delta--neg' | 'reports-delta--neutral' {
  if (prior === 0) return 'reports-delta--neutral'
  return deltaClass(percentChange(current, prior), kind)
}

export function dollarDeltaClass(
  current: number,
  prior: number
): 'reports-delta--pos' | 'reports-delta--neg' | 'reports-delta--neutral' {
  if (prior === 0) return 'reports-delta--neutral'
  return deltaClass(Math.round(current - prior), 'expense')
}

/** Job-level expenses grouped for waterfall (everything except overhead). */
const WATERFALL_OTHER_KEYS: (keyof PLReport['expenses'])[] = [
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'other',
]

/**
 * Waterfall uses grouped bars so small expenses stay visible at chart scale:
 * Revenue → Other exp. (supplies + travel + …) → Overhead → Profit
 */
export function buildWaterfallData(report: PLReport): WaterfallData {
  const { revenue, expenses } = report
  const ranges: [number, number][] = [[0, revenue]]
  const starts: number[] = [0]
  const vals: number[] = [revenue]
  const colors: string[] = ['#22c55e']
  const labels: string[] = ['Revenue']

  const otherExpenses = WATERFALL_OTHER_KEYS.reduce((sum, key) => sum + expenses[key], 0)
  const overhead = expenses.overhead
  const business = expenses.business

  let running = revenue

  if (otherExpenses > 0) {
    const afterOther = running - otherExpenses
    starts.push(afterOther)
    vals.push(otherExpenses)
    ranges.push([afterOther, running])
    colors.push('#e06060')
    labels.push('Other exp.')
    running = afterOther
  }

  if (overhead > 0) {
    const afterOver = running - overhead
    starts.push(afterOver)
    vals.push(overhead)
    ranges.push([afterOver, running])
    colors.push('#e06060')
    labels.push('Overhead')
    running = afterOver
  }

  if (business > 0) {
    const afterBusiness = running - business
    starts.push(afterBusiness)
    vals.push(business)
    ranges.push([afterBusiness, running])
    colors.push('#e06060')
    labels.push('Business exp.')
    running = afterBusiness
  }

  const profit = running
  starts.push(0)
  vals.push(profit)
  ranges.push([0, profit])
  colors.push('#22c55e')
  labels.push('Profit')

  const peak = Math.max(revenue, ...ranges.map(([, top]) => top))
  const yMax = peak > 0 ? Math.ceil((peak * 1.1) / 100) * 100 : 100

  return { ranges, starts, vals, colors, labels, yMax }
}
