import { useMemo } from 'react'
import type { CalCategory } from '@/lib/calendar-categories'
import type { DeskJob, DeskTimeBlock } from '@/lib/types'
import {
  chipTone,
  fmtTimeShort,
  itemsOnDate,
  type ListItem,
} from '@/components/calendar/calendarListModel'

type Props = {
  dateISO: string
  jobs: DeskJob[]
  blocks: DeskTimeBlock[]
  categories: CalCategory[]
  selectedId: string | null
  selectedBlockId: string | null
  onSelectJob: (job: DeskJob) => void
  onSelectBlock: (block: DeskTimeBlock) => void
  onDraftAt: (dateISO: string, startHour: number) => void
}

export function DayAgendaView({
  dateISO,
  jobs,
  blocks,
  categories,
  selectedId,
  selectedBlockId,
  onSelectJob,
  onSelectBlock,
  onDraftAt,
}: Props) {
  const anchor = useMemo(() => new Date(`${dateISO}T12:00:00`), [dateISO])
  const items = useMemo(
    () => itemsOnDate(jobs, blocks, dateISO, categories),
    [jobs, blocks, dateISO, categories],
  )

  return (
    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-ink-100/60 px-6 py-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-ink-900">
            {anchor.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <span className="text-[13px] text-ink-400">{items.length} items</span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white py-12 text-center">
            <p className="text-sm text-ink-400">No jobs or blocks scheduled this day.</p>
            <button
              type="button"
              onClick={() => onDraftAt(dateISO, 9)}
              className="mt-3 text-[13px] font-medium text-brand-600 hover:text-brand-700"
            >
              Schedule a detail job →
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-2 left-[88px] top-2 w-px bg-ink-100" />
            <div className="space-y-1">
              {items.map((it) => (
                <AgendaRow
                  key={`${it.kind}-${it.id}`}
                  item={it}
                  selected={
                    it.kind === 'job' ? selectedId === it.id : selectedBlockId === it.id
                  }
                  onSelect={() => {
                    if (it.kind === 'job') onSelectJob(it.job)
                    else onSelectBlock(it.block)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AgendaRow({
  item,
  selected,
  onSelect,
}: {
  item: ListItem
  selected: boolean
  onSelect: () => void
}) {
  if (item.kind === 'block') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`group flex w-full items-stretch gap-3 rounded-lg py-2 pl-2 pr-3 text-left transition-colors ${
          selected ? 'bg-ink-100 ring-1 ring-ink-300' : 'hover:bg-white/80'
        }`}
      >
        <div className="w-20 shrink-0 pt-1 text-right text-[12px] font-medium text-ink-400 tabular-nums">
          {item.timeLabel}
        </div>
        <div className="flex flex-col items-center pt-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <span className="mt-1 w-px flex-1 bg-ink-100" />
        </div>
        <div className="cal-blocked-hatch flex-1 rounded-lg border border-slate-300/60 px-3 py-2">
          <div className="text-[13.5px] font-medium text-ink-500">{item.title}</div>
          {item.coexistsWithJobs ? (
            <div className="mt-0.5 text-[11.5px] text-ink-400">
              Availability blocked — scheduled jobs still show
            </div>
          ) : null}
        </div>
      </button>
    )
  }

  const tone = chipTone(item.color)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-stretch gap-3 rounded-lg py-2 pl-2 pr-3 text-left transition-colors ${
        selected ? 'bg-brand-50/60 ring-1 ring-brand-200' : 'hover:bg-white/80'
      }`}
    >
      <div className="w-20 shrink-0 pt-1 text-right text-[12px] font-medium text-ink-500 tabular-nums">
        {item.allDay ? 'All day' : fmtTimeShort(item.startHour)}
      </div>
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.accent }} />
        <span className="mt-1 w-px flex-1 bg-ink-100" />
      </div>
      <div
        className="flex-1 rounded-lg border px-3 py-2"
        style={{
          borderColor: tone.border,
          background: tone.bg,
          borderLeftWidth: 3,
          borderLeftColor: tone.accent,
        }}
      >
        <div className="text-[13.5px] font-semibold" style={{ color: tone.text }}>
          {item.title}
        </div>
        <div className="mt-0.5 text-[12px] text-ink-500">{item.subtitle}</div>
      </div>
    </button>
  )
}
