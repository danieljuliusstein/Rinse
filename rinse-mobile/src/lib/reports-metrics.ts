import type { PLReport } from '@/src/lib/reports'

export interface ComparisonBarRow {
  label: string
  amount: number
  widthPct: number
  color: string
}

export interface WaterfallData {
  ranges: [number, number][]
  starts: number[]
  vals: number[]
  colors: string[]
  labels: string[]
  /** Inclusive top of scale (may equal max positive peak). */
  yMax: number
  /** Inclusive bottom of scale (0 or lowest negative). */
  yMin: number
}

const WATERFALL_OTHER_KEYS: (keyof PLReport['expenses'])[] = [
  'supplies',
  'travel',
  'equipment',
  'marketing',
  'labor',
  'other',
]

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

/**
 * Waterfall from revenue → expense steps → ending net.
 * Supports zero-revenue / loss periods (negative running totals).
 */
export function buildWaterfallData(report: PLReport): WaterfallData {
  const { revenue, expenses } = report
  const ranges: [number, number][] = []
  const starts: number[] = []
  const vals: number[] = []
  const colors: string[] = []
  const labels: string[] = []

  const otherExpenses = WATERFALL_OTHER_KEYS.reduce((sum, key) => sum + expenses[key], 0)
  const overhead = expenses.overhead
  const business = expenses.business

  let running = revenue

  // Opening revenue (or zero baseline)
  starts.push(0)
  vals.push(revenue)
  ranges.push([0, revenue])
  colors.push('#22c55e')
  labels.push('Revenue')

  const pushDown = (amount: number, label: string) => {
    if (amount <= 0) return
    const after = running - amount
    starts.push(Math.min(running, after))
    vals.push(amount)
    ranges.push([Math.min(running, after), Math.max(running, after)])
    colors.push('#e06060')
    labels.push(label)
    running = after
  }

  pushDown(otherExpenses, 'Other exp.')
  pushDown(overhead, 'Overhead')
  pushDown(business, 'Business exp.')

  const profit = running
  starts.push(Math.min(0, profit))
  vals.push(profit)
  ranges.push([Math.min(0, profit), Math.max(0, profit)])
  colors.push(profit >= 0 ? '#22c55e' : '#e06060')
  labels.push(profit >= 0 ? 'Profit' : 'Loss')

  const flat = ranges.flatMap(([a, b]) => [a, b])
  const rawMin = Math.min(0, ...flat)
  const rawMax = Math.max(0, ...flat)
  const span = Math.max(rawMax - rawMin, 1)
  const pad = span * 0.1
  const yMin = rawMin - (rawMin < 0 ? pad : 0)
  const yMax = rawMax + pad

  return { ranges, starts, vals, colors, labels, yMax, yMin }
}
