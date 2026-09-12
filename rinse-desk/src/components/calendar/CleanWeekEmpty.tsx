import type { ReactNode } from 'react'
import { CalendarOff, Car, Sparkles, Wand2 } from 'lucide-react'
import { colors } from '@/theme/colors'
import {
  addDaysISO,
  formatDateLocalFromDate,
  weekStartFromISO,
} from '@/components/calendar/calendarListModel'

type Props = {
  anchorISO: string
  onDraftAt: (dateISO: string, startHour: number) => void
  onNewEvent: () => void
  onBlockTime: () => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CleanWeekEmpty({ anchorISO, onDraftAt, onNewEvent, onBlockTime }: Props) {
  const weekStart = weekStartFromISO(anchorISO)
  const weekStartISO = formatDateLocalFromDate(weekStart)
  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(weekStartISO, i)
    return { iso, date: new Date(`${iso}T12:00:00`), i }
  })

  return (
    <div className="flex min-h-0 flex-1 select-none bg-ink-100/40">
      <div className="grid min-w-0 flex-1 grid-cols-7">
        {days.map(({ iso, date, i }) => {
          const isWeekend = i >= 5
          return (
            <div key={iso} className="flex min-w-0 flex-col border-l border-ink-100 first:border-l-0">
              <div className="flex h-12 items-center justify-center border-b border-ink-100 bg-white/70">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    {WEEKDAYS[i]}
                  </span>
                  <span
                    className={`text-[15px] font-semibold leading-none ${
                      isWeekend ? 'text-ink-300' : 'text-ink-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDraftAt(iso, 9)}
                className="group relative flex min-h-0 flex-1 items-center justify-center bg-white/40 transition-colors hover:bg-brand-50/50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-ink-200 text-ink-300 transition-all group-hover:border-brand-300 group-hover:bg-white group-hover:text-brand-500">
                  +
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <aside className="flex w-[min(380px,40%)] shrink-0 flex-col justify-center border-l border-ink-200 bg-white px-6 py-8 shadow-card">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-[22px] font-semibold leading-tight text-ink-900">A clean week ahead.</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
          No jobs scheduled yet. This is the scheduling workbench — draft a detail job on any open
          slot, or block time off so the mobile field app knows you&apos;re unavailable.
        </p>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={onNewEvent}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white shadow-sm"
            style={{ background: colors.green }}
          >
            <Wand2 className="h-4 w-4" />
            Schedule a detail job
          </button>
          <button
            type="button"
            onClick={onBlockTime}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-800 shadow-sm hover:bg-ink-50"
          >
            <CalendarOff className="h-4 w-4" />
            Block time off
          </button>
        </div>

        <div className="mt-6 space-y-2.5">
          <Hint icon={<Car className="h-3.5 w-3.5" />}>
            Click any empty day column to drop a draft at 9:00 AM — nothing saves until you hit Save.
          </Hint>
          <Hint icon={<CalendarOff className="h-3.5 w-3.5" />}>
            Blocked time is shared with the mobile app and hides those slots from booking.
          </Hint>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-4 text-[11.5px] text-ink-400">
          Drive order &amp; stop maps live in{' '}
          <span className="font-medium text-ink-500">Routes</span>. Client list in{' '}
          <span className="font-medium text-ink-500">Contacts</span>.
        </div>
      </aside>
    </div>
  )
}

function Hint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px] text-ink-500">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}
