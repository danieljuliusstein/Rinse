import {
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export type RouteVariant = 'run' | 'empty' | 'needsplot'
export type DockStatus = 'road' | 'api-missing' | 'busy' | 'partial' | 'idle'

type Props = {
  stopCount: number
  plottedCount: number
  unplotCount: number
  status: DockStatus
  onPlot: () => void
  onOptimize: () => void
  plotDisabled?: boolean
  optimizeDisabled?: boolean
  variant?: RouteVariant
}

const statusConfig: Record<
  DockStatus,
  { icon: typeof CheckCircle2; label: string; color: string; bg: string }
> = {
  road: {
    icon: CheckCircle2,
    label: 'Road path ready',
    color: 'text-brand-600',
    bg: 'bg-brand-100',
  },
  idle: {
    icon: CheckCircle2,
    label: 'Ready to plot',
    color: 'text-ink-600',
    bg: 'bg-ink-100',
  },
  'api-missing': {
    icon: AlertTriangle,
    label: 'Routing API missing',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  },
  busy: {
    icon: Loader2,
    label: 'Working…',
    color: 'text-brand-600',
    bg: 'bg-brand-100',
  },
  partial: {
    icon: AlertTriangle,
    label: 'Some stops need plotting',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  },
}

/**
 * Floating action dock — Plot / Refresh, Optimize, status.
 */
export function ActionDock({
  stopCount,
  plottedCount,
  unplotCount,
  status,
  onPlot,
  onOptimize,
  plotDisabled,
  optimizeDisabled,
  variant = 'run',
}: Props) {
  const cfg = statusConfig[status]
  const StatusIcon = cfg.icon
  const busy = status === 'busy'

  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white/95 px-2 py-1.5 shadow-dock backdrop-blur-md animate-routes-fade-up">
      <div className="flex items-center gap-1.5 pl-1 pr-2">
        <div className="flex h-7 min-w-7 items-center justify-center rounded-md bg-ink-900 px-1.5 text-xs font-extrabold text-white">
          {stopCount}
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-bold text-ink-900">
            {stopCount === 1 ? '1 stop' : `${stopCount} stops`}
          </div>
          <div className="text-[9px] font-medium text-ink-400">
            {plottedCount} plotted
            {unplotCount > 0 ? ` · ${unplotCount} no map` : ''}
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-ink-200" />

      <div
        className={`flex items-center gap-1 rounded-full ${cfg.bg} ${cfg.color} px-2 py-1 text-[10px] font-bold`}
      >
        <StatusIcon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
        {cfg.label}
      </div>

      <div className="h-6 w-px bg-ink-200" />

      <button
        type="button"
        onClick={onPlot}
        disabled={plotDisabled || busy}
        className="flex h-9 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-xs font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-600 active:scale-95 disabled:opacity-40"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
        {variant === 'needsplot' ? 'Plot stops' : 'Refresh pins'}
      </button>

      <button
        type="button"
        onClick={onOptimize}
        disabled={optimizeDisabled || busy || stopCount < 2}
        className="group relative flex h-9 items-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-4 text-xs font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.6)] transition hover:bg-brand-700 active:scale-95 disabled:opacity-40"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Optimize drive order
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>
    </div>
  )
}
