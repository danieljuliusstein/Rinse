import { useMemo } from 'react'
import { Sun } from 'lucide-react'
import type { CalCategory } from '@/lib/calendar-categories'
import type { DeskJob, DeskTimeBlock } from '@/lib/types'
import {
  chipTone,
  fmtTimeShort,
  itemsOnDate,
  type ListBlockItem,
  type ListJobItem,
} from '@/components/calendar/calendarListModel'

type Props = {
  dateISO: string
  jobs: DeskJob[]
  blocks: DeskTimeBlock[]
  /** Closed weekday from booking_schedule.work_days (not an explicit time_block). */
  scheduleClosed?: boolean
  categories: CalCategory[]
  selectedId: string | null
  selectedBlockId: string | null
  onSelectJob: (job: DeskJob) => void
  onSelectBlock: (block: DeskTimeBlock) => void
  onDraftAt: (dateISO: string, startHour: number) => void
}

const HALVES = [
  { label: 'Morning', range: [0, 12] as const, hint: '7a – 12p' },
  { label: 'Afternoon', range: [12, 24] as const, hint: '12p – 7p' },
] as const

export function DayAmPmView({
  dateISO,
  jobs,
  blocks,
  scheduleClosed = false,
  categories,
  selectedId,
  selectedBlockId,
  onSelectJob,
  onSelectBlock,
  onDraftAt,
}: Props) {
  const items = useMemo(
    () => itemsOnDate(jobs, blocks, dateISO, categories),
    [jobs, blocks, dateISO, categories],
  )

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-ink-100/40">
      {HALVES.map((half) => {
        const [s, e] = half.range
        const halfItems = items.filter((it) => {
          if (it.allDay) return half.label === 'Morning'
          return it.startHour >= s && it.startHour < e
        })
        return (
          <div
            key={half.label}
            className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card ${
              scheduleClosed ? 'cal-blocked-hatch' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-ink-900">{half.label}</span>
              </div>
              <span className="text-[12px] text-ink-400">
                {scheduleClosed ? 'Closed' : half.hint}
              </span>
            </div>
            <div
              className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-3"
              onDoubleClick={() => onDraftAt(dateISO, half.label === 'Afternoon' ? 13 : 9)}
            >
              {halfItems.length === 0 ? (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
                  <p className="text-[13px] text-ink-400">
                    {scheduleClosed
                      ? 'Closed on schedule'
                      : `Open ${half.label.toLowerCase()}`}
                  </p>
                  {!scheduleClosed ? (
                    <button
                      type="button"
                      onClick={() => onDraftAt(dateISO, half.label === 'Afternoon' ? 13 : 9)}
                      className="mt-2 text-[12px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      + Add a job
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {halfItems.map((it) =>
                    it.kind === 'block' ? (
                      <BlockChip
                        key={it.id}
                        item={it}
                        selected={selectedBlockId === it.id}
                        onSelect={() => onSelectBlock(it.block)}
                      />
                    ) : (
                      <JobChip
                        key={it.id}
                        item={it}
                        selected={selectedId === it.id}
                        onSelect={() => onSelectJob(it.job)}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobChip({
  item,
  selected,
  onSelect,
}: {
  item: ListJobItem
  selected: boolean
  onSelect: () => void
}) {
  const tone = chipTone(item.color)
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: tone.accent,
        borderColor: tone.border,
        background: tone.bg,
      }}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
        selected ? 'ring-1 ring-brand-500' : 'hover:brightness-[0.98]'
      }`}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tone.accent }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold" style={{ color: tone.text }}>
          {item.title}
        </div>
        <div className="truncate text-[11.5px] text-ink-500">{item.client}</div>
      </div>
      <span className="shrink-0 text-[11px] text-ink-400 tabular-nums">
        {item.allDay ? 'All day' : fmtTimeShort(item.startHour)}
      </span>
    </button>
  )
}

function BlockChip({
  item,
  selected,
  onSelect,
}: {
  item: ListBlockItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cal-blocked-hatch flex w-full items-center gap-2 rounded-lg border border-slate-300/60 px-3 py-2 text-left ${
        selected ? 'ring-1 ring-slate-400' : ''
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
      <span className="text-[13px] font-medium text-ink-500 truncate flex-1">{item.title}</span>
      <span className="ml-auto text-[11px] text-ink-400 tabular-nums shrink-0">
        {item.timeLabel}
      </span>
    </button>
  )
}
