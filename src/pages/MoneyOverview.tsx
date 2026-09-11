import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts'
import { priorRangeFor } from '@/lib/rinse-core'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import { useDeskNav } from '@/providers/DeskNavProvider'
import {
  MONEY_RANGE_CHIPS,
  buildMoneyChartSeries,
  getDeskMoneyBundle,
  moneyAxis,
  plToSummary,
  unpaidAr,
  type MoneyRangeKey,
} from '@/lib/metrics'
import { colors } from '@/theme/colors'
import { useMemo, useState } from 'react'
import {
  IconAlert,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCheck,
  IconPlus,
  IconTrendingDown,
  IconTrendingUp,
} from '@/components/NavIcons'

function momPct(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return 0
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function formatMomBadge(pct: number | null): {
  label: string
  tone: 'good' | 'bad' | 'neutral'
  direction: 'up' | 'down' | 'flat'
} {
  if (pct == null) return { label: 'New', tone: 'neutral', direction: 'flat' }
  if (pct === 0) return { label: 'No change', tone: 'neutral', direction: 'flat' }
  const up = pct > 0
  const abs = Math.abs(pct)
  const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10
  return {
    label: `${rounded}%`,
    tone: up ? 'good' : 'bad',
    direction: up ? 'up' : 'down',
  }
}

function TrendBadge({
  badge,
  invert,
}: {
  badge: ReturnType<typeof formatMomBadge>
  invert?: boolean
}) {
  const good = invert ? badge.tone === 'bad' : badge.tone === 'good'
  const bad = invert ? badge.tone === 'good' : badge.tone === 'bad'
  const Icon =
    badge.direction === 'up' ? IconTrendingUp : badge.direction === 'down' ? IconTrendingDown : IconCheck
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-medium rounded-full px-2 py-0.5"
      style={{
        background: good ? colors.greenSoft : bad ? '#FEE2E2' : colors.bg,
        color: good ? colors.greenText : bad ? '#991B1B' : colors.textMuted,
      }}
    >
      <Icon size={12} />
      {badge.label}
    </span>
  )
}

export default function MoneyOverview() {
  const { invoices, expenses, overhead, jobs } = useData()
  const { createExpense } = useCreateActions()
  const { setPage, openReceipts } = useDeskNav()
  const [range, setRange] = useState<MoneyRangeKey>('this_month')

  const bundle = useMemo(
    () => getDeskMoneyBundle(jobs, expenses, overhead, range),
    [jobs, expenses, overhead, range],
  )

  const pl = useMemo(
    () => plToSummary(bundle.current, expenses, bundle.bounds.start, bundle.bounds.end),
    [bundle, expenses],
  )
  const priorPl = useMemo(() => {
    const priorBounds = priorRangeFor(range)
    return plToSummary(bundle.prior, expenses, priorBounds.start, priorBounds.end)
  }, [bundle.prior, expenses, range])

  const chartData = useMemo(() => {
    const rows = buildMoneyChartSeries(
      jobs,
      expenses,
      overhead,
      range,
      bundle.bounds.start,
      bundle.bounds.end,
    )
    return rows.length
      ? rows
      : [
          { label: '—', revenue: 0, expenses: 0, net: 0 },
          { label: '—', revenue: 0, expenses: 0, net: 0 },
        ]
  }, [jobs, expenses, overhead, range, bundle.bounds])

  const ar = unpaidAr(invoices)
  const unpaidInvoices = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status === 'sent' ||
          i.status === 'overdue' ||
          (i.balance_due > 0 && i.status !== 'paid' && i.status !== 'void' && i.status !== 'cancelled'),
      ),
    [invoices],
  )

  const rangeLabel = MONEY_RANGE_CHIPS.find((c) => c.key === range)?.label ?? 'This month'
  const chartGrain =
    range === 'this_week'
      ? 'daily'
      : range === 'this_month' || range === 'last_month'
        ? 'weekly'
        : 'monthly'

  const revBadge = formatMomBadge(momPct(pl.revenue, priorPl.revenue))
  const expBadge = formatMomBadge(momPct(pl.expenses, priorPl.expenses))
  const netBadge = formatMomBadge(momPct(pl.netProfit, priorPl.netProfit))
  const arClear = unpaidInvoices.length === 0
  const netLoss = pl.netProfit < 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Money dashboard"
        subtitle={`${rangeLabel} · ${pl.jobCount} ${pl.jobCount === 1 ? 'job' : 'jobs'}`}
        actions={
          <button
            type="button"
            onClick={() => void createExpense({ navigate: true })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-full hover:opacity-90 transition-opacity"
            style={{ background: colors.green }}
          >
            <IconPlus />
            Log expense
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: colors.bg }}>
        <div className="flex flex-wrap gap-2">
          {MONEY_RANGE_CHIPS.map((chip) => {
            const active = chip.key === range
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setRange(chip.key)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  background: active ? colors.green : '#fff',
                  color: active ? '#fff' : colors.text,
                  borderColor: active ? colors.green : colors.border,
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setPage('invoices')}
            className="bg-white rounded-xl p-4 border text-left transition-colors hover:border-green-200"
            style={{ borderColor: colors.border }}
          >
            <div className="flex justify-between items-start">
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
                style={{ background: '#CCFBF1', color: '#0F766E' }}
              >
                <IconArrowDownLeft />
              </div>
              <TrendBadge badge={revBadge} />
            </div>
            <p className="text-xs text-gray-500 mt-2.5">Revenue</p>
            <p className="text-[22px] font-medium text-gray-900 tracking-tight">
              {moneyAxis(pl.revenue)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Job revenue + tips · {rangeLabel.toLowerCase()}
            </p>
          </button>

          <button
            type="button"
            onClick={() => openReceipts('expenses')}
            className="bg-white rounded-xl p-4 border text-left transition-colors hover:border-green-200"
            style={{ borderColor: colors.border }}
          >
            <div className="flex justify-between items-start">
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
                style={{ background: '#DBEAFE', color: '#1E40AF' }}
              >
                <IconArrowUpRight />
              </div>
              <TrendBadge badge={expBadge} invert />
            </div>
            <p className="text-xs text-gray-500 mt-2.5">Total expenses</p>
            <p className="text-[22px] font-medium text-gray-900 tracking-tight">
              {moneyAxis(pl.expenses)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Job costs + receipts + overhead · open Receipts
            </p>
          </button>

          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: colors.border }}>
            <div className="flex justify-between items-start">
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
                style={{
                  background: pl.netProfit >= 0 ? colors.greenSoft : '#FEE2E2',
                  color: pl.netProfit >= 0 ? colors.greenText : '#991B1B',
                }}
              >
                {pl.netProfit >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              </div>
              <TrendBadge badge={netBadge} />
            </div>
            <p className="text-xs text-gray-500 mt-2.5">{netLoss ? 'Net loss' : 'Net profit'}</p>
            <p
              className="text-[22px] font-medium tracking-tight"
              style={{ color: pl.netProfit >= 0 ? colors.text : '#991B1B' }}
            >
              {moneyAxis(pl.netProfit)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Job revenue minus expenses · avg {moneyAxis(pl.avgJob)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPage('invoices')}
            className="rounded-xl p-4 border text-left transition-colors"
            style={{
              background: arClear ? colors.greenSoft : '#FFFBEB',
              borderColor: arClear ? '#C0DD97' : '#FDE68A',
            }}
          >
            <div className="flex justify-between items-start">
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-white"
                style={{ color: arClear ? colors.greenText : '#92400E' }}
              >
                {arClear ? <IconCheck /> : <IconAlert />}
              </div>
              <span
                className="text-[11px] font-medium rounded-full px-2 py-0.5"
                style={{
                  background: arClear ? '#fff' : '#FEF3C7',
                  color: arClear ? colors.greenText : '#92400E',
                }}
              >
                {arClear ? 'Clear' : 'Open'}
              </span>
            </div>
            <p className="text-xs mt-2.5" style={{ color: arClear ? '#3B6D11' : '#92400E' }}>
              Accounts receivable
            </p>
            <p
              className="text-[22px] font-medium tracking-tight"
              style={{ color: arClear ? '#173404' : '#78350F' }}
            >
              {moneyAxis(ar)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: arClear ? '#3B6D11' : '#A16207' }}>
              {arClear
                ? 'All caught up'
                : `${unpaidInvoices.length} unpaid · open Invoices`}
            </p>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPage('invoices')}
            className="text-xs font-semibold px-3 py-2 rounded-lg text-white"
            style={{ background: colors.greenDark }}
          >
            Open Invoices
          </button>
          <button
            type="button"
            onClick={() => openReceipts('payments')}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700"
          >
            Payment receipts
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="mb-1">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Income, Expenses &amp; Profit
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {rangeLabel} · {chartGrain} buckets · green = revenue · blue = expenses · red = profit
            </p>
          </div>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={chartData}
                margin={{ top: 28, right: 36, left: 12, bottom: 12 }}
                barGap={3}
                barCategoryGap={chartData.length <= 3 ? '35%' : chartData.length <= 5 ? '38%' : '42%'}
              >
                <CartesianGrid stroke="#eef2f7" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  minTickGap={4}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  yAxisId="cash"
                  tickFormatter={(v) => moneyAxis(Number(v))}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  domain={[
                    (dataMin: number) => (dataMin < 0 ? Math.floor(dataMin * 1.2) : 0),
                    (dataMax: number) => Math.ceil(dataMax * 1.08),
                  ]}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => moneyAxis(Number(v))}
                  labelFormatter={(label) => String(label)}
                />
                <Legend />
                <Bar
                  yAxisId="cash"
                  dataKey="revenue"
                  name="Revenue"
                  fill={colors.green}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="cash"
                  dataKey="expenses"
                  name="Expenses"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="cash"
                  type="monotone"
                  dataKey="net"
                  name="Profit"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
