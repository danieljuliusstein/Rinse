import { useMemo, useState } from 'react'
import type { DeskClient } from '@/lib/types'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

const HEAT_EMPTY = '#F1EFE8'
const HEAT_LOW = '#378ADD'
const HEAT_HIGH = '#0C447C'

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function heatColor(count: number, max: number): string {
  if (count <= 0 || max <= 0) return HEAT_EMPTY
  const t = count / max
  if (t <= 0.5) return HEAT_LOW
  return HEAT_HIGH
}

type Props = {
  clients: DeskClient[]
  onOpen?: () => void
}

export function NewContactsCard({ clients, onOpen }: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const { cells, total, thisWeek, rangeLabel } = useMemo(() => {
    const today = startOfLocalDay()
    const days: { key: string; count: number; date: Date; label: string }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push({
        key: dayKey(d),
        count: 0,
        date: d,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      })
    }
    const byKey = new Map(days.map((x) => [x.key, x]))
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    const weekStartKey = dayKey(weekStart)

    for (const c of clients) {
      if (!c.created) continue
      const d = new Date(c.created)
      const key = Number.isNaN(d.getTime()) ? c.created.slice(0, 10) : dayKey(d)
      const row = byKey.get(key)
      if (row) row.count += 1
    }

    const total = days.reduce((s, d) => s + d.count, 0)
    const thisWeek = days.filter((d) => d.key >= weekStartKey).reduce((s, d) => s + d.count, 0)
    const max = Math.max(...days.map((d) => d.count), 0)
    const first = days[0]!.date
    const last = days[days.length - 1]!.date
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      cells: days.map((d) => ({ ...d, color: heatColor(d.count, max) })),
      total,
      thisWeek,
      rangeLabel: `${fmt(first)} – ${fmt(last)}`,
    }
  }, [clients])

  return (
    <WidgetCard onOpen={onOpen}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 shrink-0">New Contacts</p>
      <div className="flex items-baseline gap-2 mt-1 shrink-0">
        <span className="text-[26px] font-medium text-gray-900 leading-none tabular-nums">{total}</span>
        <span className="text-xs text-gray-400">
          total · {thisWeek} this week
        </span>
      </div>

      <div
        role="img"
        aria-label={`Contribution heatmap of the last 30 days. ${total} new contacts total.`}
        className="grid grid-cols-10 gap-0.5 mt-2 flex-1 min-h-0 content-center"
        onClick={stopCardClick}
      >
        {cells.map((cell) => {
          const active = hoverKey === cell.key
          return (
            <Tip
              key={cell.key}
              label={`${cell.label} · ${cell.count} contact${cell.count === 1 ? '' : 's'}`}
              className="w-full min-h-0"
            >
              <button
                type="button"
                aria-label={`${cell.label}: ${cell.count} new contacts`}
                onMouseEnter={() => setHoverKey(cell.key)}
                onMouseLeave={() => setHoverKey(null)}
                onFocus={() => setHoverKey(cell.key)}
                onBlur={() => setHoverKey(null)}
                onClick={(e) => {
                  stopCardClick(e)
                  onOpen?.()
                }}
                className="w-full aspect-square max-h-full rounded transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                style={{
                  background: cell.color,
                  transform: active ? 'scale(1.18)' : undefined,
                  boxShadow: active ? '0 0 0 2px rgba(12,68,124,0.25)' : undefined,
                }}
              />
            </Tip>
          )
        })}
      </div>

      <div className="flex justify-between items-center mt-1.5 shrink-0">
        <span className="text-[11px] text-gray-400">{rangeLabel}</span>
        <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
          Less
          <span className="w-[9px] h-[9px] rounded-sm" style={{ background: HEAT_EMPTY }} />
          <span className="w-[9px] h-[9px] rounded-sm" style={{ background: HEAT_LOW }} />
          <span className="w-[9px] h-[9px] rounded-sm" style={{ background: HEAT_HIGH }} />
          More
        </span>
      </div>
    </WidgetCard>
  )
}
