'use client'

import type { CSSProperties } from 'react'
import { fmt } from '@/lib/calculations'
import type { PLReport } from '@/lib/api/aggregates'

interface ArDonutChartProps {
  report: PLReport
}

export default function ArDonutChart({ report }: ArDonutChartProps) {
  const profit = Math.max(0, report.netProfit)
  const expenses = Math.max(0, report.totalExpenses)
  const total = profit + expenses || 1
  const profitPct = (profit / total) * 100
  const expensePct = 100 - profitPct
  const ringStyle = {
    '--donut-gradient': `conic-gradient(var(--green) 0 ${profitPct}%, var(--red) ${profitPct}% 100%)`,
  } as CSSProperties

  return (
    <div className="ar-donut">
      <div className="ar-donut__ring" style={ringStyle} aria-hidden="true">
        <div className="ar-donut__hole">
          <span className="ar-donut__label">Net</span>
          <span className="ar-donut__value">{fmt(report.netProfit)}</span>
        </div>
      </div>
      <div className="ar-donut__legend">
        <div className="ar-donut__legend-row">
          <span className="ar-donut__swatch ar-donut__swatch--profit" />
          <span>Profit {Math.round(profitPct)}%</span>
          <strong>{fmt(profit)}</strong>
        </div>
        <div className="ar-donut__legend-row">
          <span className="ar-donut__swatch ar-donut__swatch--expense" />
          <span>Expenses {Math.round(expensePct)}%</span>
          <strong>{fmt(expenses)}</strong>
        </div>
      </div>
    </div>
  )
}
