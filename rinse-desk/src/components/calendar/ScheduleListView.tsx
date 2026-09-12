import { useMemo } from 'react'
import { CalendarOff, ChevronRight } from 'lucide-react'
import type { CalCategory } from '@/lib/calendar-categories'
import type { DeskJob, DeskTimeBlock } from '@/lib/types'
import {
  addDaysISO,
  chipTone,
  fmtTimeShort,
  formatDateLocalFromDate,
  itemsOnDate,
  weekStartFromISO,
} from '@/components/calendar/calendarListModel'

type Props = {
  anchorISO: string
  jobs: DeskJob[]
  blocks: DeskTimeBlock[]
  /** Closed weekdays from booking_schedule.work_days. */
  scheduleClosedDates?: Set<string>
  categories: CalCategory[]
  selectedId: string | null
  selectedBlockId: string | null
  onSelectJob: (job: DeskJob) => void
  onSelectBlock: (block: DeskTimeBlock) => void
  onOpenRoutes?: () => void
  onUnblockDay?: (dateISO: string) => void
}

export function ScheduleListView({
  anchorISO,
  jobs,
  blocks,
  scheduleClosedDates,
  categories,
  selectedId,
  selectedBlockId,
  onSelectJob,
  onSelectBlock,
  onOpenRoutes,
  onUnblockDay,
}: Props) {
  const weekStart = useMemo(() => weekStartFromISO(anchorISO), [anchorISO])
  const weekStartISO = formatDateLocalFromDate(weekStart)

  const grouped = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDaysISO(weekStartISO, i)
      const date = new Date(`${iso}T12:00:00`)
      return {
        date,
        iso,
        items: itemsOnDate(jobs, blocks, iso, categories),
        scheduleClosed: scheduleClosedDates?.has(iso) ?? false,
      }
    })
  }, [weekStartISO, jobs, blocks, categories, scheduleClosedDates])

  const total = grouped.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-ink-100/60 px-6 py-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-ink-900">
            Week of{' '}
            {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h3>
          <span className="text-[13px] text-ink-400">{total} items</span>
        </div>

        <div className="space-y-6">
          {grouped.map((g) => {
            const empty = g.items.length === 0
            return (
              <div key={g.iso}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                    {g.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <span className="text-[12px] text-ink-300">
                    {g.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {empty ? (
                    <span
                      className={`text-[12px] font-medium ${
                        g.scheduleClosed ? 'text-slate-500' : 'text-ink-300'
                      }`}
                    >
                      · {g.scheduleClosed ? 'closed' : 'open'}
                    </span>
                  ) : null}
                </div>

                {empty ? (
                  g.scheduleClosed ? (
                    <button
                      type="button"
                      onClick={() => onUnblockDay?.(g.iso)}
                      className="cal-blocked-hatch w-full rounded-lg border border-slate-300/60 px-4 py-3 text-left"
                    >
                      <div className="text-[13px] font-medium text-ink-500">
                        Closed — not a work day
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-ink-400">
                        Click to open this date only
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-lg border border-dashed border-ink-200 bg-white py-3 text-center text-[13px] text-ink-400">
                      No jobs scheduled
                    </div>
                  )
                ) : (
                  <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
                    {g.scheduleClosed ? (
                      <button
                        type="button"
                        onClick={() => onUnblockDay?.(g.iso)}
                        className="cal-blocked-hatch flex w-full items-center gap-3 border-b border-ink-50 px-4 py-2.5 text-left"
                      >
                        <CalendarOff className="h-4 w-4 shrink-0 text-ink-400" />
                        <span className="flex-1 text-[13px] font-medium text-ink-500">
                          Closed on schedule
                        </span>
                        <ChevronRight className="h-4 w-4 text-ink-300 shrink-0" />
                      </button>
                    ) : null}
                    {g.items.map((it) => {
                      if (it.kind === 'block') {
                        const sel = selectedBlockId === it.id
                        return (
                          <button
                            key={`b-${it.id}`}
                            type="button"
                            onClick={() => onSelectBlock(it.block)}
                            className={`flex w-full items-center gap-3 border-b border-ink-50 px-4 py-2.5 text-left last:border-b-0 transition-colors ${
                              sel ? 'bg-ink-50' : 'hover:bg-ink-50/60'
                            }`}
                          >
                            <CalendarOff className="h-4 w-4 shrink-0 text-ink-400" />
                            <span className="w-16 shrink-0 text-[12px] font-medium text-ink-400 tabular-nums">
                              {it.timeLabel}
                            </span>
                            <span className="flex-1 text-[13px] font-medium text-ink-500 truncate">
                              {it.title}
                              {it.coexistsWithJobs ? (
                                <span className="block text-[11px] font-normal text-ink-400">
                                  Day still has jobs
                                </span>
                              ) : null}
                            </span>
                            <ChevronRight className="h-4 w-4 text-ink-300 shrink-0" />
                          </button>
                        )
                      }
                      const tone = chipTone(it.color)
                      const sel = selectedId === it.id
                      return (
                        <button
                          key={`j-${it.id}`}
                          type="button"
                          onClick={() => onSelectJob(it.job)}
                          className={`flex w-full items-center gap-3 border-b border-ink-50 px-4 py-2.5 text-left last:border-b-0 transition-colors ${
                            sel ? 'bg-brand-50/50' : 'hover:bg-ink-50/60'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: tone.accent }}
                          />
                          <span className="w-16 shrink-0 text-[12px] font-medium text-ink-500 tabular-nums">
                            {it.allDay ? 'All day' : fmtTimeShort(it.startHour)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-[13px] font-semibold"
                              style={{ color: tone.text }}
                            >
                              {it.title}
                            </span>
                            <span className="block truncate text-[11.5px] text-ink-400">
                              {it.client}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg border border-ink-100 bg-white px-4 py-3 text-[12px] text-ink-400">
          Schedule owns <span className="font-medium text-ink-500">when</span> jobs run. Drive order
          &amp; stop maps live in{' '}
          {onOpenRoutes ? (
            <button
              type="button"
              onClick={onOpenRoutes}
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Routes
            </button>
          ) : (
            <span className="font-medium text-ink-500">Routes</span>
          )}
          .
        </div>
      </div>
    </div>
  )
}
