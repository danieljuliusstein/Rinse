import { useMemo, useState } from 'react'
import type { DeskClient } from '@/lib/types'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

const BAR_ACTIVE = '#2a78d6'
const BAR_EMPTY = '#F1EFE8'

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mondayOfWeek(from = new Date()) {
  const today = startOfLocalDay(from)
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  return monday
}

type DayRow = { label: string; key: string; count: number; full: string; isToday: boolean }

type Props = {
  clients: DeskClient[]
  onOpen?: () => void
}

export function ContactTrendCard({ clients, onOpen }: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const { days, weekTotal, lastWeekTotal, delta } = useMemo(() => {
    const today = startOfLocalDay()
    const todayKey = dayKey(today)
    const monday = mondayOfWeek(today)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const days: DayRow[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = dayKey(d)
      days.push({
        label: labels[i]!,
        key,
        count: 0,
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        isToday: key === todayKey,
      })
    }
    const byDay = new Map(days.map((x) => [x.key, x]))

    const lastMonday = new Date(monday)
    lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(monday)
    lastSunday.setDate(monday.getDate() - 1)
    const lastStart = dayKey(lastMonday)
    const lastEnd = dayKey(lastSunday)

    let lastWeekTotal = 0

    for (const c of clients) {
      if (!c.created) continue
      const d = new Date(c.created)
      if (Number.isNaN(d.getTime())) continue
      const key = dayKey(d)

      const dayRow = byDay.get(key)
      if (dayRow) dayRow.count += 1

      if (key >= lastStart && key <= lastEnd) lastWeekTotal += 1
    }

    const weekTotal = days.reduce((s, d) => s + d.count, 0)

    return {
      days,
      weekTotal,
      lastWeekTotal,
      delta: weekTotal - lastWeekTotal,
    }
  }, [clients])

  const max = Math.max(...days.map((d) => d.count), 1)
  const deltaPositive = delta > 0
  const deltaNegative = delta < 0
  const deltaLabel = delta > 0 ? `+${delta}` : String(delta)

  return (
    <WidgetCard onOpen={onOpen} className="w-full">
      <div className="flex justify-between shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Contact Trend</p>
        <span className="text-[12px] text-gray-400">This week</span>
      </div>

      <div className="flex items-end gap-1.5 mt-2 flex-1 min-h-0" onClick={stopCardClick}>
        {days.map((d) => {
          const hPct = d.count > 0 ? Math.max(18, (d.count / max) * 70) : 0
          const active = hoverKey === d.key
          const labelActive = d.count > 0 || d.isToday
          return (
            <Tip
              key={d.key}
              label={`${d.full} · ${d.count} contact${d.count === 1 ? '' : 's'}`}
              className="flex-1 h-full flex"
            >
              <button
                type="button"
                onMouseEnter={() => setHoverKey(d.key)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={() => onOpen?.()}
                className="w-full h-full flex flex-col items-center justify-end gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-200 rounded"
              >
                {d.count > 0 ? (
                  <span className="text-[10px] font-medium text-gray-900 tabular-nums leading-none">
                    {d.count}
                  </span>
                ) : null}
                <div
                  className="w-[70%] rounded transition-all duration-150"
                  style={{
                    height: d.count > 0 ? `${hPct}%` : 2,
                    background: d.count > 0 ? BAR_ACTIVE : BAR_EMPTY,
                    transform: active ? 'scaleY(1.08)' : undefined,
                    opacity: hoverKey && !active ? 0.45 : 1,
                  }}
                />
                <span
                  className={`text-[9px] shrink-0 ${labelActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
                >
                  {d.label}
                </span>
              </button>
            </Tip>
          )
        })}
      </div>

      <div className="flex gap-1.5 mt-2.5 shrink-0" onClick={stopCardClick}>
        <div className="flex-1 rounded-lg bg-[#F4F5F3] px-2 py-1.5">
          <div className="text-[9px] text-gray-500">This week</div>
          <div className="text-sm font-medium text-gray-900 tabular-nums">{weekTotal}</div>
        </div>
        <div className="flex-1 rounded-lg bg-[#F4F5F3] px-2 py-1.5">
          <div className="text-[9px] text-gray-500">Last week</div>
          <div className="text-sm font-medium text-gray-900 tabular-nums">{lastWeekTotal}</div>
        </div>
        <div
          className="flex-1 rounded-lg px-2 py-1.5"
          style={{
            background: deltaPositive ? '#EAF9EF' : deltaNegative ? '#FEF2F2' : '#F4F5F3',
          }}
        >
          <div
            className="text-[9px]"
            style={{
              color: deltaPositive ? '#16A34A' : deltaNegative ? '#DC2626' : '#6B7280',
            }}
          >
            vs last wk
          </div>
          <div
            className="text-sm font-medium tabular-nums"
            style={{
              color: deltaPositive ? '#16A34A' : deltaNegative ? '#DC2626' : '#111827',
            }}
          >
            {deltaLabel}
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}
