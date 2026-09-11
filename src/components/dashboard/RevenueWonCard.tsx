import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { IconCalendar, IconCheck, IconInvoice } from '@/components/NavIcons'
import { money, revenueWonPeriod, type RevenueRangeDays } from '@/lib/metrics'
import type { DeskInvoice, DeskJob } from '@/lib/types'
import { colors } from '@/theme/colors'

const RANGES: { id: RevenueRangeDays; label: string }[] = [
  { id: 7, label: '7D' },
  { id: 30, label: '30D' },
  { id: 90, label: '90D' },
]

const BAR_COLOR = '#1D9E75'
const AVG_LINE = '#B4B2A9'
const GRID = '#e1e0d9'
const TICK = '#898781'

function IconArrowUp({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function IconArrowDown({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  )
}

function StatChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-700"
      style={{ background: colors.bg, fontSize: '12px' }}
    >
      <span className="inline-flex shrink-0 opacity-90">{icon}</span>
      {children}
    </span>
  )
}

type Props = {
  jobs: DeskJob[]
  invoices: DeskInvoice[]
  invoicesSent: number
  onOpenInvoices?: () => void
}

export function RevenueWonCard({ jobs, invoices, invoicesSent, onOpenInvoices }: Props) {
  const [range, setRange] = useState<RevenueRangeDays>(30)

  const period = useMemo(() => revenueWonPeriod(jobs, invoices, range), [jobs, invoices, range])
  const last5 = useMemo(() => revenueWonPeriod(jobs, invoices, 5), [jobs, invoices])

  const trendUp = (period.pctChange ?? 0) >= 0
  const showTrend = period.priorRevenue > 0 || period.revenue > 0

  function stopClick(e: MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      role={onOpenInvoices ? 'button' : undefined}
      tabIndex={onOpenInvoices ? 0 : undefined}
      onClick={onOpenInvoices}
      onKeyDown={(e) => {
        if (!onOpenInvoices) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenInvoices()
        }
      }}
      className="bg-white rounded-2xl p-3.5 border border-gray-100 text-left hover:border-green-200 hover:shadow-sm transition-all h-full min-h-0 min-w-0 overflow-hidden flex flex-col cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-200"
      style={{ borderLeft: `3px solid ${colors.green}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Gross revenue</p>
        <div
          role="group"
          aria-label="Revenue time range"
          className="flex gap-0.5 rounded-full p-0.5"
          style={{ background: colors.bg }}
          onClick={stopClick}
        >
          {RANGES.map((r) => {
            const active = range === r.id
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={active}
                onClick={(e) => {
                  stopClick(e)
                  setRange(r.id)
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  active ? 'font-medium text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={active ? { boxShadow: '0 0 0 1px #E5E7EB' } : undefined}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 mt-1 flex-wrap shrink-0">
        <p className="text-[28px] leading-none font-medium tracking-tight" style={{ color: colors.greenText }}>
          {money(period.revenue)}
        </p>
        {showTrend && period.pctChange !== null ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={
              trendUp
                ? { background: colors.greenSoft, color: colors.greenText }
                : { background: '#FEE2E2', color: '#991B1B' }
            }
          >
            {trendUp ? <IconArrowUp /> : <IconArrowDown />}
            {Math.abs(period.pctChange)}% vs prior {range}d
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5 my-2.5 shrink-0" onClick={stopClick}>
        <StatChip icon={<span style={{ color: colors.greenText }} className="inline-flex"><IconCheck size={13} /></span>}>
          {period.jobCount} paid/completed job{period.jobCount === 1 ? '' : 's'}
        </StatChip>
        <StatChip
          icon={
            <span className="text-gray-500 inline-flex [&_svg]:w-[13px] [&_svg]:h-[13px]">
              <IconCalendar />
            </span>
          }
        >
          {money(last5.revenue)} last 5 days
        </StatChip>
        <StatChip icon={<span className="text-gray-500 inline-flex"><IconInvoice size={13} /></span>}>
          {invoicesSent} invoice{invoicesSent === 1 ? '' : 's'} sent
        </StatChip>
      </div>

      <div className="flex-1 min-h-0 w-full" onClick={stopClick}>
        {period.hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={period.series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: TICK }}
                axisLine={false}
                tickLine={false}
                interval={range <= 12 ? 0 : 'preserveStartEnd'}
                minTickGap={range > 30 ? 28 : 16}
              />
              <YAxis
                tick={{ fontSize: 10, fill: TICK }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `$${v}`}
                domain={[0, 'auto']}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(29, 158, 117, 0.06)' }}
                formatter={(value, name) => {
                  const n = typeof value === 'number' ? value : Number(value ?? 0)
                  if (name === 'avg') return [money(n), 'Average']
                  return [money(n), 'Revenue']
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { tooltipLabel?: string } | undefined
                  return row?.tooltipLabel ?? ''
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Bar
                dataKey="daily"
                name="daily"
                fill={BAR_COLOR}
                radius={[3, 3, 0, 0]}
                maxBarSize={8}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="avg"
                stroke={AVG_LINE}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white">
            <p className="text-sm text-gray-500 font-medium">No gross revenue in this period</p>
            <p className="text-xs text-gray-400 mt-1">Paid, completed &amp; invoiced jobs show as daily bars</p>
          </div>
        )}
      </div>
    </div>
  )
}
