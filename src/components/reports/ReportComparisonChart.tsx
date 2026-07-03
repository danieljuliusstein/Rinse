'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PLReport } from '@/lib/api/aggregates'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { isLoss } from '@/lib/calculations'
import { buildComparisonBars } from '@/lib/reports-metrics'

interface ReportComparisonChartProps {
  report: PLReport
}

/**
 * Side-by-side proportional comparison — each column scales to the larger of
 * revenue vs expenses so the gap between high expenses and low revenue is visible.
 */
export default function ReportComparisonChart({ report }: ReportComparisonChartProps) {
  const [animate, setAnimate] = useState(false)
  const bars = useMemo(() => buildComparisonBars(report), [report])
  const loss = isLoss(report.netProfit)
  const revenueBar = bars.find((b) => b.label === 'Revenue')
  const expenseBar = bars.find((b) => b.label === 'Expenses')

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [report])

  if (!revenueBar || !expenseBar) return null

  return (
    <div className="report-card report-comparison">
      <div className="report-comparison-dual">
        <div className="report-comparison-col">
          <span className="report-comparison-col-label">Revenue</span>
          <CurrencyAmount
            value={revenueBar.amount}
            variant="revenue"
            className="report-comparison-col-value"
          />
          <div className="report-comparison-col-track" aria-hidden="true">
            <div
              className="report-comparison-col-fill report-comparison-col-fill--revenue"
              style={{ '--fill-size': animate ? `${revenueBar.widthPct}%` : '0%' } as CSSProperties}
            />
          </div>
          <span className="report-comparison-col-pct">{Math.round(revenueBar.widthPct)}% of peak</span>
        </div>

        <div className="report-comparison-col">
          <span className="report-comparison-col-label">Expenses</span>
          <CurrencyAmount
            value={expenseBar.amount}
            variant="expense"
            unsigned
            className="report-comparison-col-value"
          />
          <div className="report-comparison-col-track" aria-hidden="true">
            <div
              className="report-comparison-col-fill report-comparison-col-fill--expense"
              style={{ '--fill-size': animate ? `${expenseBar.widthPct}%` : '0%' } as CSSProperties}
            />
          </div>
          <span className="report-comparison-col-pct">{Math.round(expenseBar.widthPct)}% of peak</span>
        </div>
      </div>

      <div className={`report-comparison-net${loss ? ' report-comparison-net--loss' : ''}`}>
        <span className="report-comparison-net-label">{loss ? 'Net loss' : 'Net profit'}</span>
        <CurrencyAmount value={report.netProfit} variant="profit" className="report-comparison-net-value" />
      </div>

      <p className={`report-comparison-insight${loss ? ' report-comparison-insight--loss' : ''}`}>
        {loss
          ? 'Expenses exceeded revenue — you spent more than you earned.'
          : 'Revenue exceeded expenses — you made money this period.'}
      </p>
    </div>
  )
}
