import { GripVertical, Clock, Navigation, MapPinOff, Car } from 'lucide-react'

export type StopCardModel = {
  id: string
  client: string
  service: string
  time?: string
  address: string
  plotted: boolean
  driveFromPrev?: string
  duration?: string
}

type Props = {
  stop: StopCardModel
  index: number
  selected: boolean
  onSelect: () => void
  isLast?: boolean
  /** Drag handle props from dnd-kit */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  setNodeRef?: (node: HTMLElement | null) => void
  style?: React.CSSProperties
  isDragging?: boolean
}

/**
 * A single stop in the run sheet — numbered badge, client, service,
 * time · address, optional drive ribbon, “No map” amber state, drag handle.
 */
export function StopCard({
  stop,
  index,
  selected,
  onSelect,
  isLast = false,
  dragHandleProps,
  setNodeRef,
  style,
  isDragging,
}: Props) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border p-2.5 transition-all duration-200 ${
        isDragging ? 'opacity-40' : ''
      } ${
        selected
          ? 'border-brand-400 bg-white shadow-lift ring-2 ring-brand-200'
          : 'border-ink-200/80 bg-white hover:border-brand-200 hover:shadow-chip'
      }`}
    >
      {!isLast && stop.plotted && stop.driveFromPrev ? (
        <div className="absolute -bottom-2.5 left-7 z-10 flex items-center gap-0.5">
          <div className="h-2 w-px bg-brand-300/60" />
          <span className="flex items-center gap-0.5 rounded-full bg-atmosphere px-1.5 py-px text-[8px] font-bold text-brand-600 ring-1 ring-brand-200">
            <Navigation className="h-2 w-2" />
            {stop.driveFromPrev}
          </span>
          <div className="h-2 w-px bg-brand-300/60" />
        </div>
      ) : null}

      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={onSelect}
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
            stop.plotted
              ? selected
                ? 'bg-brand-600 text-white shadow-ring'
                : 'bg-brand-100 text-brand-700 ring-2 ring-brand-200'
              : 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
          }`}
          aria-label={`Select stop ${index + 1}`}
        >
          {stop.plotted ? index + 1 : <MapPinOff className="h-4 w-4" />}
        </button>

        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-ink-900">{stop.client}</h3>
            {stop.time ? (
              <div className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-ink-500">
                <Clock className="h-3 w-3" />
                {stop.time}
              </div>
            ) : null}
          </div>

          <div className="mt-0.5 flex items-center gap-1">
            <Car className="h-3 w-3 shrink-0 text-brand-500" />
            <p className="truncate text-xs font-semibold text-brand-700">{stop.service}</p>
          </div>

          <p
            className={`mt-1 truncate text-[11px] font-medium ${
              stop.plotted ? 'text-ink-500' : 'text-amber-700/80'
            }`}
          >
            {stop.address || 'No address'}
          </p>

          {!stop.plotted ? (
            <div className="mt-1.5 flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
              <MapPinOff className="h-3 w-3" />
              No map — needs plotting
            </div>
          ) : null}

          {stop.plotted && stop.duration ? (
            <div className="mt-1 flex items-center gap-2 text-[9px] font-medium text-ink-400">
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5">{stop.duration} on-site</span>
            </div>
          ) : null}
        </button>

        <button
          type="button"
          className="flex shrink-0 cursor-grab flex-col items-center pt-1 text-ink-300 transition hover:text-brand-500 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
