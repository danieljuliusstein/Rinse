'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { PLReport } from '@/lib/api/aggregates'
import type { DateRangeKey } from '@/lib/api/reports'
import { fmtSigned } from '@/lib/calculations'
import {
  barWidthPct,
  buildPLProgressBars,
  formatOverflowAmount,
  formatPct,
  formatPctSigned,
  plProgressPeriodLabel,
  type PLProgressBar,
} from '@/lib/reports-metrics'

interface BarRowProps {
  bar: PLProgressBar
  revenue: number
  animate: boolean
  variant: 'revenue' | 'expense' | 'profit'
}

function formatBarAmount(bar: PLProgressBar): string {
  if (bar.isExpense) {
    if (bar.value === 0) return fmtSigned(0, 2)
    return `−${fmtSigned(bar.value, 2)}`
  }
  return fmtSigned(bar.value, 2)
}

function formatBarPct(bar: PLProgressBar, revenue: number, variant: BarRowProps['variant']): string {
  if (variant === 'revenue') return '100%'
  if (variant === 'profit') return formatPctSigned(bar.value, revenue)
  return formatPct(bar.value, revenue)
}

function BarRow({ bar, revenue, animate, variant }: BarRowProps) {
  const magnitude = Math.abs(bar.value)
  const { width, overflow } = barWidthPct(variant === 'expense' ? bar.value : magnitude, revenue)
  const pct = formatBarPct(bar, revenue, variant)

  return (
    <div
      className={`pl-bar-row${
        variant === 'expense' ? ' pl-bar-row--expense' : variant === 'profit' ? ' pl-bar-row--profit' : ''
      }`}
    >
      <div className="pl-bar-meta">
        <span
          className={`pl-bar-name${
            variant === 'revenue'
              ? ' pl-bar-name--revenue'
              : variant === 'profit'
                ? ' pl-bar-name--profit'
                : ' pl-bar-name--expense'
          }`}
        >
          {bar.name}
        </span>
        <div className="pl-bar-amount-wrap">
          <span
            className={`pl-bar-amount${
              variant === 'profit' ? ' pl-bar-amount--profit-headline' : ''
            }${
              bar.isLoss
                ? ' pl-bar-amount--loss'
                : bar.isProfit
                  ? ' pl-bar-amount--profit'
                  : bar.isExpense && bar.value > 0
                    ? ' pl-bar-amount--expense'
                    : variant === 'revenue'
                      ? ' pl-bar-amount--revenue'
                      : ''
            }`}
          >
            {formatBarAmount(bar)}
          </span>
          <span className="pl-bar-pct">{pct}</span>
        </div>
      </div>
      <div
        className={`pl-bar-track${
          variant === 'profit' ? ' pl-bar-track--profit' : variant === 'revenue' ? ' pl-bar-track--revenue' : ''
        }`}
      >
        <div
          className={`pl-bar-fill${bar.isLoss ? ' pl-bar-fill--loss' : ''}`}
          style={
            {
              '--fill-size': animate ? (variant === 'revenue' ? '100%' : `${width}%`) : '0%',
              '--bar-color': bar.color,
            } as CSSProperties
          }
        />
      </div>
      {variant === 'expense' && overflow > 0 && (
        <div className="pl-bar-overflow-badge">
          ⚠ {formatOverflowAmount(bar.value, revenue)} over revenue
        </div>
      )}
    </div>
  )
}

interface PLProgressBarCardProps {
  report: PLReport
  range: DateRangeKey
}

export default function PLProgressBarCard({ report, range }: PLProgressBarCardProps) {
  const [animate, setAnimate] = useState(false)
  const { revenue, expenseBars, totalExpenseBar, profitBar } = buildPLProgressBars(report)

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [report, range])

  const revenueBar: PLProgressBar = {
    name: 'Revenue',
    value: revenue,
    color: 'var(--green-text)',
    highlight: true,
    isExpense: false,
  }

  return (
    <div className="pl-progress-card">
      <div className="pl-progress-label">PROFIT &amp; LOSS — {plProgressPeriodLabel(range)}</div>

      <div className="pl-progress-bars">
        <BarRow bar={revenueBar} revenue={revenue} animate={animate} variant="revenue" />

        <div className="pl-progress-divider" />
        <div className="pl-progress-expenses-label">EXPENSES</div>

        {expenseBars.map((bar) => (
          <BarRow key={bar.name} bar={bar} revenue={revenue} animate={animate} variant="expense" />
        ))}
        {expenseBars.length === 0 && (
          <BarRow bar={totalExpenseBar} revenue={revenue} animate={animate} variant="expense" />
        )}

        <div className="pl-progress-divider" />

        <BarRow bar={profitBar} revenue={revenue} animate={animate} variant="profit" />
      </div>
    </div>
  )
}
