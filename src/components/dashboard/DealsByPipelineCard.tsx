import { useMemo, useState } from 'react'
import { money } from '@/lib/metrics'
import type { DeskLead, LeadStage } from '@/lib/types'
import { WidgetCard, stopCardClick } from './widgetUi'

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'inquiry', label: 'Inquiry', color: '#639922' },
  { id: 'quoted', label: 'Quoted', color: '#BA7517' },
  { id: 'booked', label: 'Scheduled', color: '#0F6E56' },
]

const EXTRA_COLORS = ['#3C3489', '#854F0B', '#0C447C']

type Props = {
  leads: DeskLead[]
  onOpen?: () => void
  onOpenStage?: (stage: LeadStage) => void
}

function funnelPolygons(counts: number[]): { points: string; fill: string; cy: number }[] {
  const n = counts.length
  if (n === 0) return []

  const allZero = counts.every((c) => c === 0)
  const weights = allZero ? counts.map((_, i) => n - i) : counts.map((c) => Math.max(c, 0))
  const max = Math.max(...weights, 1)

  const vbW = 260
  const vbH = 160
  const gap = 4
  const segH = (vbH - gap * (n - 1)) / n
  const cx = vbW / 2
  const maxHalf = 120
  const minHalf = 24

  const halfAt = (w: number) => minHalf + (w / max) * (maxHalf - minHalf)
  const topHalves = weights.map((w) => halfAt(w))
  const bottomHalves = weights.map((_, i) =>
    i < n - 1 ? topHalves[i + 1]! : Math.max(minHalf * 0.75, topHalves[i]! * 0.55),
  )

  return weights.map((_, i) => {
    const y0 = i * (segH + gap)
    const y1 = y0 + segH
    const ht = topHalves[i]!
    const hb = bottomHalves[i]!
    const points = [
      [cx - ht, y0],
      [cx + ht, y0],
      [cx + hb, y1],
      [cx - hb, y1],
    ]
      .map(([x, y]) => `${x},${y}`)
      .join(' ')
    const fill = STAGES[i]?.color ?? EXTRA_COLORS[(i - STAGES.length) % EXTRA_COLORS.length]!
    return { points, fill, cy: (y0 + y1) / 2 }
  })
}

export function DealsByPipelineCard({ leads, onOpen, onOpenStage }: Props) {
  const [hoverId, setHoverId] = useState<LeadStage | null>(null)

  const { stages, totalValue, polys } = useMemo(() => {
    const stages = STAGES.map((s) => {
      const rows = leads.filter((l) => l.stage === s.id)
      return {
        ...s,
        count: rows.length,
        value: rows.reduce((sum, l) => sum + (l.quote_amount || 0), 0),
      }
    })
    const totalValue = stages.reduce((s, x) => s + x.value, 0)
    const polys = funnelPolygons(stages.map((s) => s.count))
    return { stages, totalValue, polys }
  }, [leads])

  const empty = stages.every((s) => s.count === 0)
  const hoverStage = stages.find((s) => s.id === hoverId)

  function goStage(stage: LeadStage) {
    onOpenStage?.(stage) ?? onOpen?.()
  }

  return (
    <WidgetCard onOpen={onOpen} className="w-full !p-3">
      <div className="flex justify-between items-baseline shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Deals by Pipeline</p>
        <span className="text-[11px] text-gray-500">
          Total <span className="text-gray-900 font-medium">{money(totalValue)}</span>
        </span>
      </div>

      <div className="flex gap-2 mt-1.5 items-stretch flex-1 min-h-0" onClick={stopCardClick}>
        <div className="flex-1 flex flex-col justify-evenly min-w-0 min-h-0 overflow-hidden">
          {stages.map((s, i) => {
            const next = stages[i + 1]
            const convert =
              next == null ? null : s.count > 0 ? Math.round((next.count / s.count) * 100) : null
            const active = hoverId === s.id
            return (
              <div key={s.id} className="min-h-0">
                <button
                  type="button"
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(s.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={() => goStage(s.id)}
                  className="w-full text-left rounded-md px-1 py-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-200"
                  style={{ background: active ? `${s.color}14` : undefined }}
                >
                  <div className="text-[11px] font-medium text-gray-900 flex items-center gap-1.5 leading-tight">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform"
                      style={{ background: s.color, transform: active ? 'scale(1.35)' : undefined }}
                    />
                    {s.label}
                  </div>
                  <div className="text-[9px] text-gray-400 ml-3 leading-tight">
                    {s.count} deal{s.count === 1 ? '' : 's'} · {money(s.value)}
                    {next ? (
                      <span className="ml-1">
                        · ↓ {convert !== null ? `${convert}%` : '—'}
                      </span>
                    ) : null}
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        <div className="relative flex-shrink-0 self-stretch w-[38%] max-w-[120px] min-h-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 260 160"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={stages.map((s) => `${s.label} ${s.count} deals`).join(', ')}
          >
            <title>Deal pipeline funnel</title>
            {polys.map((p, i) => {
              const stage = stages[i]!
              const active = hoverId === stage.id
              return (
                <polygon
                  key={stage.id}
                  points={p.points}
                  fill={p.fill}
                  opacity={empty ? 0.45 : active ? 1 : hoverId ? 0.4 : 1}
                  className="cursor-pointer"
                  style={{ transition: 'opacity 150ms, filter 150ms', filter: active ? 'brightness(1.1)' : undefined }}
                  onMouseEnter={() => setHoverId(stage.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => goStage(stage.id)}
                >
                  <title>{`${stage.label}: ${stage.count} deals · ${money(stage.value)}`}</title>
                </polygon>
              )
            })}
          </svg>
          {hoverStage && (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1 z-10 rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap shadow-lg">
              {hoverStage.label} · {hoverStage.count} · {money(hoverStage.value)}
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  )
}
