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
  yMax: number
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
