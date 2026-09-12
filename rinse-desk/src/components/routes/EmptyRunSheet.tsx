import { Home, Plus, Sparkles, Car, Clock } from 'lucide-react'

type Props = {
  dateLabel: string
  onSchedule?: () => void
  hasDepot?: boolean
}

/**
 * Empty-day run sheet — creative empty state that still feels like Routes.
 */
export function EmptyRunSheet({ dateLabel, onSchedule, hasDepot }: Props) {
  return (
    <div className="flex h-full flex-col animate-routes-fade-up">
      <div className="flex items-center justify-between border-b border-ink-200/80 px-5 py-3">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
            Run sheet
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-ink-400">{dateLabel} · 0 stops</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-[10px] font-bold text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
          Open day
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="relative mb-5">
          <div className="absolute -inset-6 rounded-full bg-brand-100/60 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-brand-300 bg-white shadow-chip">
            <Car className="h-6 w-6 text-brand-400" strokeWidth={1.6} />
          </div>
          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-chip animate-routes-soft-float">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        <h3 className="text-center text-base font-extrabold text-ink-900">
          A fresh day, an open road.
        </h3>
        <p className="mt-1.5 max-w-[15rem] text-center text-xs text-ink-500">
          No stops scheduled yet. Add a job for this day and it’ll appear as the first pin on
          the route.
        </p>

        <div className="mt-6 w-full max-w-[15rem] space-y-1.5">
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-ink-200 bg-white/50 px-2.5 py-2 opacity-60">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-brand-300 text-[10px] font-bold text-brand-400">
              1
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded-full bg-ink-200" />
              <div className="h-1 w-1/2 rounded-full bg-ink-100" />
            </div>
            <Clock className="h-2.5 w-2.5 text-ink-300" />
          </div>
          <div className="ml-3 flex items-center gap-1 pl-2 text-[8px] font-bold text-brand-300">
            <span className="h-2 w-px bg-brand-200" />
            drive
            <span className="h-2 w-px bg-brand-200" />
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-ink-200 bg-white/50 px-2.5 py-2 opacity-40">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-brand-300 text-[10px] font-bold text-brand-400">
              2
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-2/3 rounded-full bg-ink-200" />
              <div className="h-1 w-2/5 rounded-full bg-ink-100" />
            </div>
          </div>
        </div>

        {onSchedule ? (
          <button
            type="button"
            onClick={onSchedule}
            className="mt-6 flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_-10px_rgba(22,163,74,0.7)] transition hover:bg-brand-700 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule a stop
          </button>
        ) : null}

        <div className="mt-6 flex items-center gap-1.5 rounded-full bg-depot-500/5 px-2.5 py-1 text-[10px] font-semibold text-depot-600">
          <Home className="h-3 w-3" />
          {hasDepot
            ? 'Depot set · starts & ends at home base'
            : 'Set Business Address in Settings for a depot'}
        </div>
      </div>
    </div>
  )
}
