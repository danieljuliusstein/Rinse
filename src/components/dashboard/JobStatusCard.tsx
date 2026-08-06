import { useMemo, useState } from 'react'
import type { DeskJob } from '@/lib/types'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

type StatusKey = 'scheduled' | 'in_progress' | 'done'

type Props = {
  jobs: DeskJob[]
  onOpen?: () => void
  onOpenStatus?: (status: StatusKey) => void
}

const DONE_STATUSES = new Set(['completed', 'paid', 'invoiced'])

export function JobStatusCard({ jobs, onOpen, onOpenStatus }: Props) {
  const [hover, setHover] = useState<StatusKey | null>(null)

  const { scheduled, inProgress, done, max } = useMemo(() => {
    const scheduled = jobs.filter((j) => j.status === 'scheduled').length
    const inProgress = jobs.filter((j) => j.status === 'in_progress').length
    const done = jobs.filter((j) => DONE_STATUSES.has(j.status)).length
    const max = Math.max(scheduled, inProgress, done, 1)
    return { scheduled, inProgress, done, max }
  }, [jobs])

  const blocks: {
    key: StatusKey
    label: string
    count: number
    bg: string
    text: string
    bar: string
    labelColor: string
  }[] = [
    {
      key: 'scheduled',
      label: 'Scheduled',
      count: scheduled,
      bg: '#F4F5F3',
      text: '#5F5E5A',
      bar: '#D3D1C7',
      labelColor: '#6B7280',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      count: inProgress,
      bg: '#FAEEDA',
      text: '#854F0B',
      bar: '#EF9F27',
      labelColor: '#854F0B',
    },
    {
      key: 'done',
      label: 'Done',
      count: done,
      bg: '#EAF9EF',
      text: '#16A34A',
      bar: '#22C55E',
      labelColor: '#16A34A',
    },
  ]

  return (
    <WidgetCard onOpen={onOpen} className="w-full">
      <div className="flex justify-between items-center shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Job Status</p>
      </div>

      <div className="flex gap-1.5 mt-2 flex-1 min-h-0 items-stretch" onClick={stopCardClick}>
        {blocks.map((b) => {
          const pct = Math.round((b.count / max) * 100)
          const active = hover === b.key
          return (
            <Tip key={b.key} label={`${b.count} ${b.label.toLowerCase()} · open calendar`} className="flex-1 h-full flex">
              <button
                type="button"
                onMouseEnter={() => setHover(b.key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onOpenStatus?.(b.key) ?? onOpen?.()}
                className="w-full h-full rounded-[10px] p-2 text-center flex flex-col items-center justify-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-green-200"
                style={{
                  background: b.bg,
                  transform: active ? 'translateY(-2px)' : undefined,
                  boxShadow: active ? '0 4px 12px rgba(0,0,0,0.06)' : undefined,
                }}
              >
                <div className="text-xl font-medium tabular-nums leading-none" style={{ color: b.text }}>
                  {b.count}
                </div>
                <div className="text-[10px] my-0.5" style={{ color: b.labelColor }}>
                  {b.label}
                </div>
                <div className="h-1 rounded-full mx-auto bg-black/5 overflow-hidden" style={{ width: '80%' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(pct, b.count > 0 ? 3 : 0)}%`, background: b.bar }}
                  />
                </div>
              </button>
            </Tip>
          )
        })}
      </div>
    </WidgetCard>
  )
}
