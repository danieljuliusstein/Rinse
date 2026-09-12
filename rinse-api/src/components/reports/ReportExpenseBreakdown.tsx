'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PLReport } from '@/lib/api/aggregates'
import { fmtDetailed } from '@/lib/calculations'
import { buildExpenseBreakdown, formatExpensePctOfTotal } from '@/lib/reports-metrics'

interface ReportExpenseBreakdownProps {
  report: PLReport
}

export default function ReportExpenseBreakdown({ report }: ReportExpenseBreakdownProps) {
  const [animate, setAnimate] = useState(false)
  const rows = useMemo(() => buildExpenseBreakdown(report), [report])

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [report])

  if (rows.length === 0) {
    return (
      <div className="report-card report-card--empty report-expense-breakdown">
        <div className="report-card-empty">No expenses in this period</div>
      </div>
    )
  }

  return (
    <div className="report-card report-expense-breakdown">
      {rows.map((row) => (
        <div key={row.key} className="report-expense-row">
          <div className="report-expense-row-meta">
            <span className="report-expense-row-label">{row.label}</span>
            <div className="report-expense-row-right">
              <span className="report-expense-row-amount">{fmtDetailed(row.amount)}</span>
              <span className="report-expense-row-pct">
                {formatExpensePctOfTotal(row.amount, report.totalExpenses)}
              </span>
            </div>
          </div>
          <div className="report-expense-track">
            <div
              className="report-expense-fill"
              style={
                {
                  '--fill-size': animate ? `${row.pctOfTotal}%` : '0%',
                  '--bar-color': row.color,
                } as CSSProperties
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
}
