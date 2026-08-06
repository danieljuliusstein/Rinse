import { useRef } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Sun } from 'lucide-react'

type Props = {
  isoDate: string
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onPickDate: (iso: string) => void
}

function partsFor(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    weekdayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dayNum: String(d.getDate()),
  }
}

/**
 * Day scrubber — Prev / prominent date chip / Today / Next.
 * Center chip opens a native date picker.
 */
export function DayScrubber({
  isoDate,
  isToday,
  onPrev,
  onNext,
  onToday,
  onPickDate,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { weekday, weekdayShort, monthDay, dayNum } = partsFor(isoDate)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-600 active:scale-95"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => {
          const el = inputRef.current
          if (!el) return
          try {
            el.showPicker?.()
          } catch {
            el.click()
          }
        }}
        className="relative flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 shadow-chip transition hover:border-brand-300"
      >
        <div className="flex h-7 w-7 flex-col items-center justify-center rounded-lg bg-brand-600 text-white">
          <span className="text-[7px] font-bold uppercase leading-none tracking-wider">
            {weekdayShort}
          </span>
          <span className="text-xs font-extrabold leading-none">{dayNum}</span>
        </div>
        <div className="pr-1 text-left">
          <div className="flex items-center gap-1 text-xs font-bold text-ink-900">
            {weekday}, {monthDay}
            {isToday && (
              <span className="flex items-center gap-0.5 rounded-full bg-brand-100 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-brand-700">
                <Sun className="h-2 w-2" /> Today
              </span>
            )}
          </div>
          <div className="text-[10px] font-medium text-ink-400">
            {isToday ? 'Planning the live day' : 'Draft route'}
          </div>
        </div>
        <input
          ref={inputRef}
          type="date"
          value={isoDate}
          onChange={(e) => {
            if (e.target.value) onPickDate(e.target.value)
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </button>

      <button
        type="button"
        onClick={onToday}
        className="flex h-8 items-center gap-1 rounded-full border border-ink-200 bg-white px-2.5 text-[11px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-600 active:scale-95"
      >
        <CalendarDays className="h-3 w-3" />
        Today
      </button>

      <button
        type="button"
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-600 active:scale-95"
        aria-label="Next day"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
