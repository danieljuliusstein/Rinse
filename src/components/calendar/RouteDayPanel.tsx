import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DeskClient, DeskJob } from '@/lib/types'
import { saveRouteOrder, updateClient } from '@/lib/api'
import { sortJobsByRoute } from '@/lib/metrics'
import {
  geocodeAddress,
  isRouteApiConfigured,
  optimizeRouteTrip,
} from '@/lib/route-api'
import {
  buildRouteStops,
  jobsForDate,
  mergeOptimizedOrder,
} from '@/lib/route-optimize'
import { colors } from '@/theme/colors'
import RouteMap from './RouteMap'
import { PanelEdgeToggle } from '@/components/automations/PanelEdgeToggle'

type Props = {
  date: string
  jobs: DeskJob[]
  setJobs: React.Dispatch<React.SetStateAction<DeskJob[]>>
  setClients: React.Dispatch<React.SetStateAction<DeskClient[]>>
  businessAddress: string
  depotCoords: { lat: number; lng: number } | null
  onDepotCoords: (c: { lat: number; lng: number } | null) => void
  onClose: () => void
  toast: (msg: string) => void
}

function SortableStopRow({
  id,
  index,
  name,
  time,
  address,
  plottable,
}: {
  id: string
  index: number
  name: string
  time?: string
  address: string
  plottable: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-1 rounded-lg border border-gray-200 bg-white"
    >
      <button
        type="button"
        className="px-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <div className="flex-1 min-w-0 py-2 pr-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: colors.green }}
          >
            {index + 1}
          </span>
          <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
          {!plottable ? (
            <span className="text-[9px] font-semibold uppercase text-amber-700 bg-amber-50 px-1 rounded shrink-0">
              No map
            </span>
          ) : null}
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
          {time ? `${time} · ` : ''}
          {address || 'No address'}
        </p>
      </div>
    </div>
  )
}

export default function RouteDayPanel({
  date,
  jobs,
  setJobs,
  setClients,
  businessAddress,
  depotCoords,
  onDepotCoords,
  onClose,
  toast,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const dayJobs = useMemo(
    () => sortJobsByRoute(jobsForDate(jobs, date)),
    [jobs, date],
  )
  const stops = useMemo(() => buildRouteStops(dayJobs), [dayJobs])
  const ids = useMemo(() => dayJobs.map((j) => j.id), [dayJobs])

  const persistOrder = useCallback(
    async (orderedIds: string[]) => {
      await saveRouteOrder(orderedIds)
      setJobs((prev) =>
        prev.map((j) => {
          const idx = orderedIds.indexOf(j.id)
          if (idx < 0) return j
          return { ...j, route_order: idx + 1 }
        }),
      )
    },
    [setJobs],
  )

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(ids, oldIndex, newIndex)
    try {
      await persistOrder(next)
      toast('Route order saved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save order')
    }
  }

  const ensureCoords = async (): Promise<{
    plottable: Array<{ id: string; lat: number; lng: number }>
    skipped: string[]
    depot: { lat: number; lng: number } | null
  }> => {
    const skipped: string[] = []
    const plottable: Array<{ id: string; lat: number; lng: number }> = []
    let depot = depotCoords

    if (businessAddress.trim() && !depot) {
      try {
        depot = await geocodeAddress(businessAddress)
        onDepotCoords(depot)
      } catch {
        /* optional depot */
      }
    }

    for (const stop of stops) {
      const client = stop.job.client
      if (!client) {
        skipped.push(stop.job.id)
        continue
      }
      if (!stop.address) {
        skipped.push(stop.job.id)
        continue
      }
      if (stop.plottable && stop.lat != null && stop.lng != null) {
        plottable.push({ id: stop.job.id, lat: stop.lat, lng: stop.lng })
        continue
      }
      try {
        const coords = await geocodeAddress(stop.address)
        const geocoded_at = new Date().toISOString()
        await updateClient(client.id, {
          lat: coords.lat,
          lng: coords.lng,
          geocoded_at,
        })
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id ? { ...c, lat: coords.lat, lng: coords.lng, geocoded_at } : c,
          ),
        )
        setJobs((prev) =>
          prev.map((j) =>
            j.client_id === client.id && j.client
              ? {
                  ...j,
                  client: { ...j.client, lat: coords.lat, lng: coords.lng, geocoded_at },
                }
              : j,
          ),
        )
        plottable.push({ id: stop.job.id, lat: coords.lat, lng: coords.lng })
      } catch {
        skipped.push(stop.job.id)
      }
    }

    return { plottable, skipped, depot }
  }

  const onOptimize = async () => {
    if (!isRouteApiConfigured()) {
      toast('Set VITE_APP_API_URL to enable Optimize')
      return
    }
    if (dayJobs.length < 2) {
      toast('Need at least two stops to optimize')
      return
    }
    setBusy(true)
    try {
      const { plottable, skipped, depot } = await ensureCoords()
      if (plottable.length < 2) {
        toast('Need at least two geocoded stops')
        return
      }
      const result = await optimizeRouteTrip(plottable, depot)
      const merged = mergeOptimizedOrder(dayJobs, result.orderedIds)
      await persistOrder(merged)
      if (skipped.length) {
        toast(`Optimized · skipped ${skipped.length} without map pin`)
      } else {
        toast(
          result.duration_minutes != null
            ? `Optimized · ~${result.duration_minutes} min drive`
            : 'Route optimized',
        )
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Optimize failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="relative w-[min(420px,100%)] bg-white border-l border-gray-100 flex flex-col overflow-hidden flex-shrink-0">
      <PanelEdgeToggle side="right" expanded onToggle={onClose} label="route" />
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Route</p>
            <h2 className="text-sm font-semibold text-gray-900">{date}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {dayJobs.length} stop{dayJobs.length === 1 ? '' : 's'}
              {!isRouteApiConfigured() ? ' · API URL missing' : ''}
            </p>
          </div>
          <button
            type="button"
            disabled={busy || dayJobs.length < 2}
            onClick={() => void onOptimize()}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: colors.green }}
          >
            {busy ? 'Working…' : 'Optimize'}
          </button>
        </div>
      </div>

      <div className="px-3 pt-3 h-56 flex-shrink-0">
        <RouteMap
          jobs={dayJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          depot={depotCoords}
          className="h-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {dayJobs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No jobs this day</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {stops.map((s, i) => (
                <SortableStopRow
                  key={s.job.id}
                  id={s.job.id}
                  index={i}
                  name={s.job.client?.name ?? 'Client'}
                  time={s.job.start_time}
                  address={s.address}
                  plottable={s.plottable}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {!businessAddress.trim() ? (
        <p className="px-3 pb-3 text-[10px] text-gray-400">
          Tip: set Business Address in Settings for a depot start/end.
        </p>
      ) : null}
    </aside>
  )
}
