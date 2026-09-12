import { describe, expect, it } from 'vitest'
import { fmtSigned } from './calculations'
import type { PLReport } from './api/aggregates'
import {
  barWidthPct,
  buildComparisonBars,
  buildExpenseBreakdown,
  formatBreakdownNetProfit,
  formatDollarDelta,
  formatExpensePctOfTotal,
  formatKpiNetProfit,
  formatMarginPill,
  formatNetProfitLabel,
  formatPct,
  formatPctSigned,
  formatPercentDelta,
  formatTotalExpensesAmount,
  marginPillClass,
  shouldShowLeadSourceReport,
} from './reports-metrics'

const sampleReport: PLReport = {
  revenue: 120,
  expenses: {
    supplies: 0,
    travel: 0,
    equipment: 18,
    marketing: 0,
    labor: 0,
    overhead: 0,
    business: 332,
    other: 0,
  },
  totalExpenses: 350,
  netProfit: -230,
  marginPct: -192,
  jobCount: 2,
}

describe('fmtSigned', () => {
  it('formats positive values without minus', () => {
    expect(fmtSigned(120)).toBe('$120.00')
  })

  it('formats negative values with minus prefix', () => {
    expect(fmtSigned(-125.51, 2)).toBe('-$125.51')
  })
})

describe('formatKpiNetProfit', () => {
  it('rounds to whole dollars with sign', () => {
    expect(formatKpiNetProfit(-125.51)).toBe('-$126')
    expect(formatKpiNetProfit(50.4)).toBe('$50')
  })
})

describe('formatBreakdownNetProfit', () => {
  it('shows two decimal places with sign', () => {
    expect(formatBreakdownNetProfit(-125.51)).toBe('-$125.51')
  })
})

describe('marginPillClass', () => {
  it('returns loss class for negative margin', () => {
    expect(marginPillClass(-105)).toContain('reports-margin-pill--loss')
  })

  it('returns positive class for non-negative margin', () => {
    expect(marginPillClass(55)).toContain('reports-margin-pill--pos')
  })
})

describe('barWidthPct', () => {
  it('caps width at 100% when expense exceeds revenue', () => {
    const { width, overflow } = barWidthPct(227.51, 120)
    expect(width).toBe(100)
    expect(overflow).toBeCloseTo(107.51, 2)
  })

  it('returns no overflow when expense is within revenue', () => {
    const { width, overflow } = barWidthPct(50, 120)
    expect(width).toBeCloseTo(41.67, 1)
    expect(overflow).toBe(0)
  })

  it('handles zero revenue', () => {
    expect(barWidthPct(100, 0)).toEqual({ width: 0, overflow: 0 })
  })
})

describe('formatDollarDelta', () => {
  it('shows em dash when both expense totals are zero', () => {
    expect(formatDollarDelta(0, 0, 'this_month')).toBe('—')
  })

  it('shows New when prior is zero and current is non-zero', () => {
    expect(formatDollarDelta(246, 0, 'this_month')).toBe('New')
  })

  it('shows dollar change when prior is non-zero', () => {
    expect(formatDollarDelta(300, 246, 'this_month')).toBe('↑ $54 vs last mo.')
  })
})

describe('formatPct', () => {
  it('shows em dash when revenue is zero', () => {
    expect(formatPct(50, 0)).toBe('—')
  })

  it('rounds percentage against revenue', () => {
    expect(formatPct(50, 120)).toBe('42%')
  })
})

describe('formatPctSigned', () => {
  it('prefixes minus for negative profit share', () => {
    expect(formatPctSigned(-30, 120)).toBe('-25%')
  })
})

describe('formatTotalExpensesAmount', () => {
  it('shows zero without minus prefix', () => {
    expect(formatTotalExpensesAmount(0)).toBe('$0.00')
  })

  it('shows signed expense total', () => {
    expect(formatTotalExpensesAmount(227.51)).toBe('-$227.51')
  })
})

describe('formatMarginPill', () => {
  it('prefixes minus for negative margin', () => {
    expect(formatMarginPill(-105)).toBe('-105%')
  })

  it('shows positive margin without minus', () => {
    expect(formatMarginPill(55)).toBe('55%')
  })
})

describe('formatNetProfitLabel', () => {
  it('labels loss and profit correctly', () => {
    expect(formatNetProfitLabel(-1)).toBe('Net loss')
    expect(formatNetProfitLabel(0)).toBe('Net profit')
    expect(formatNetProfitLabel(50)).toBe('Net profit')
  })
})

describe('formatExpensePctOfTotal', () => {
  it('computes share of total expenses', () => {
    expect(formatExpensePctOfTotal(332, 350)).toBe('95%')
    expect(formatExpensePctOfTotal(18, 350)).toBe('5%')
  })
})

describe('buildExpenseBreakdown', () => {
  it('returns only non-zero rows with pct of total expenses', () => {
    const rows = buildExpenseBreakdown(sampleReport)
    expect(rows).toHaveLength(2)
    expect(rows[0].label).toBe('Business expenses')
    expect(rows[0].pctOfTotal).toBeCloseTo(94.86, 1)
    expect(rows[1].label).toBe('Equipment')
    expect(rows[1].pctOfTotal).toBeCloseTo(5.14, 1)
  })
})

describe('buildComparisonBars', () => {
  it('scales bars to the larger of revenue and expenses', () => {
    const bars = buildComparisonBars(sampleReport)
    expect(bars[0].label).toBe('Revenue')
    expect(bars[1].label).toBe('Expenses')
    expect(bars[0].widthPct).toBeCloseTo(34.29, 1)
    expect(bars[1].widthPct).toBe(100)
  })
})

describe('shouldShowLeadSourceReport', () => {
  it('hides when fewer than 3 jobs or only one source', () => {
    expect(shouldShowLeadSourceReport(1, 2)).toBe(false)
    expect(shouldShowLeadSourceReport(1, 5)).toBe(false)
    expect(shouldShowLeadSourceReport(2, 5)).toBe(true)
    expect(shouldShowLeadSourceReport(3, 2)).toBe(false)
  })
})

describe('formatPercentDelta', () => {
  it('shows New when prior is zero and current is non-zero', () => {
    expect(formatPercentDelta(120, 0, 'this_month')).toBe('New')
  })

  it('shows em dash when both are zero', () => {
    expect(formatPercentDelta(0, 0, 'this_month')).toBe('—')
  })

  it('shows percent change when prior is non-zero', () => {
    expect(formatPercentDelta(150, 100, 'this_month')).toBe('↑ 50% vs last mo.')
    expect(formatPercentDelta(80, 100, 'this_month')).toBe('↓ 20% vs last mo.')
  })
})
