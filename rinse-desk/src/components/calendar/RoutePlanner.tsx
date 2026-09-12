import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Plus } from 'lucide-react'
import type { DeskClient, DeskJob } from '@/lib/types'
import { saveRouteOrder, updateClient } from '@/lib/api'
import { sortJobsByRoute } from '@/lib/metrics'
import {
  addressesLookSame,
  geocodeAddress,
  isRouteApiConfigured,
  optimizeRouteTrip,
  suggestAddress,
} from '@/lib/route-api'
import {
  buildRouteStops,
  jobsForDate,
  mergeOptimizedOrder,
} from '@/lib/route-optimize'
import RouteMap from './RouteMap'
import { ActionDock, type DockStatus, type RouteVariant } from '@/components/routes/ActionDock'
import { EmptyRunSheet } from '@/components/routes/EmptyRunSheet'
import { StopCard, type StopCardModel } from '@/components/routes/StopCard'

type Props = {
  date: string
  jobs: DeskJob[]
  setJobs: React.Dispatch<React.SetStateAction<DeskJob[]>>
  setClients: React.Dispatch<React.SetStateAction<DeskClient[]>>
  businessAddress: string
  depotCoords: { lat: number; lng: number } | null
  onDepotCoords: (c: { lat: number; lng: number } | null) => void
  toast: (msg: string) => void
  onSchedule?: () => void
}

/** e.g. 45 → "45 min", 60 → "1 hr", 111 → "1 hr 51 min" */
function formatDriveDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (rem === 0) return `${h} hr`
  return `${h} hr ${rem} min`
}

function formatOnSiteHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return ''
  const totalMin = Math.round(hours * 60)
  return formatDriveDuration(totalMin)
}

function serviceLabel(job: DeskJob): string {
  return job.packageName || job.vehicle_type || job.notes?.trim() || 'Detail'
}

function dateParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    dateLabel: d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  }
}

function SortableStopCard({
  stop,
  index,
  selected,
  onSelect,
  isLast,
}: {
  stop: StopCardModel
  index: number
  selected: boolean
  onSelect: () => void
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <StopCard
      stop={stop}
      index={index}
      selected={selected}
      onSelect={onSelect}
      isLast={isLast}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...listeners, ...attributes }}
    />
  )
}

export default function RoutePlanner({
  date,
  jobs,
  setJobs,
  setClients,
  businessAddress,
  depotCoords,
  onDepotCoords,
  toast,
  onSchedule,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [roadGeometry, setRoadGeometry] = useState<Array<[number, number]> | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const dayJobs = useMemo(() => sortJobsByRoute(jobsForDate(jobs, date)), [jobs, date])
  const stops = useMemo(() => buildRouteStops(dayJobs), [dayJobs])
  const ids = useMemo(() => dayJobs.map((j) => j.id), [dayJobs])
  const needsPlot = stops.some((s) => Boolean(s.address) && !s.plottable)
  const plottedCount = stops.filter((s) => s.plottable).length
  const unplotCount = stops.length - plottedCount
  const { weekday, dateLabel } = useMemo(() => dateParts(date), [date])

  const variant: RouteVariant =
    dayJobs.length === 0 ? 'empty' : needsPlot ? 'needsplot' : 'run'

  const cardModels: StopCardModel[] = useMemo(
    () =>
      stops.map((s) => ({
        id: s.job.id,
        client: s.job.client?.name ?? 'Client',
        service: serviceLabel(s.job),
        time: s.job.start_time,
        address: s.address,
        plotted: s.plottable,
        duration: s.job.hours_worked
          ? formatOnSiteHours(s.job.hours_worked)
          : undefined,
      })),
    [stops],
  )

  useEffect(() => {
    setRoadGeometry(null)
    setSelectedJobId(null)
  }, [date])

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
    setRoadGeometry(null)
    try {
      await persistOrder(next)
      toast('Route order saved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save order')
    }
  }

  const ensureCoords = async (opts?: {
    refresh?: boolean
  }): Promise<{
    plottable: Array<{ id: string; lat: number; lng: number }>
    skipped: string[]
    depot: { lat: number; lng: number } | null
    corrected: number
  }> => {
    const skipped: string[] = []
    const plottable: Array<{ id: string; lat: number; lng: number }> = []
    let depot = depotCoords
    let corrected = 0
    const pendingCorrections: Array<{
      clientId: string
      name: string
      from: string
      to: string
      lat: number
      lng: number
    }> = []

    if (businessAddress.trim() && !depot) {
      try {
        depot = await geocodeAddress(businessAddress, {
          context: businessAddress,
        })
        onDepotCoords(depot)
      } catch {
        /* optional depot */
      }
    }

    let geocodeCalls = 0
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
      if (!opts?.refresh && stop.plottable && stop.lat != null && stop.lng != null) {
        plottable.push({ id: stop.job.id, lat: stop.lat, lng: stop.lng })
        continue
      }

      try {
        if (geocodeCalls > 0) {
          await new Promise((r) => window.setTimeout(r, 1100))
        }
        geocodeCalls += 1
        const result = await suggestAddress(stop.address, {
          limit: 5,
          context: businessAddress.trim() || undefined,
          near: depot,
        })
        const top =
          result.suggestions?.find((h) => h.quality !== 'area') ??
          result.suggestions?.[0] ??
          result
        if (top.quality === 'area') {
          skipped.push(stop.job.id)
          continue
        }
        const geocoded_at = new Date().toISOString()
        const addressDiffers = !addressesLookSame(stop.address, top.display_name)
        if (addressDiffers) {
          pendingCorrections.push({
            clientId: client.id,
            name: client.name,
            from: stop.address,
            to: top.display_name,
            lat: top.lat,
            lng: top.lng,
          })
        }

        try {
          await updateClient(client.id, {
            lat: top.lat,
            lng: top.lng,
            geocoded_at,
          })
        } catch {
          /* still use coords this session */
        }
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id ? { ...c, lat: top.lat, lng: top.lng, geocoded_at } : c,
          ),
        )
        setJobs((prev) =>
          prev.map((j) =>
            j.client_id === client.id && j.client
              ? {
                  ...j,
                  client: { ...j.client, lat: top.lat, lng: top.lng, geocoded_at },
                }
              : j,
          ),
        )
        plottable.push({ id: stop.job.id, lat: top.lat, lng: top.lng })
      } catch {
        skipped.push(stop.job.id)
      }
    }

    if (pendingCorrections.length > 0) {
      const preview = pendingCorrections
        .slice(0, 4)
        .map((c) => `• ${c.name}: ${c.to}`)
        .join('\n')
      const more =
        pendingCorrections.length > 4 ? `\n…and ${pendingCorrections.length - 4} more` : ''
      const apply = window.confirm(
        `Update ${pendingCorrections.length} contact address${pendingCorrections.length === 1 ? '' : 'es'} to the map match?\n\n${preview}${more}\n\nPins already use these locations. Choosing Cancel keeps your typed address text.`,
      )
      if (apply) {
        for (const c of pendingCorrections) {
          const geocoded_at = new Date().toISOString()
          try {
            await updateClient(c.clientId, {
              address: c.to,
              lat: c.lat,
              lng: c.lng,
              geocoded_at,
            })
            corrected += 1
            setClients((prev) =>
              prev.map((row) =>
                row.id === c.clientId
                  ? { ...row, address: c.to, lat: c.lat, lng: c.lng, geocoded_at }
                  : row,
              ),
            )
            setJobs((prev) =>
              prev.map((j) =>
                j.client_id === c.clientId && j.client
                  ? {
                      ...j,
                      client: {
                        ...j.client,
                        address: c.to,
                        lat: c.lat,
                        lng: c.lng,
                        geocoded_at,
                      },
                    }
                  : j,
              ),
            )
          } catch {
            /* keep pin; skip address text */
          }
        }
      }
    }

    return { plottable, skipped, depot, corrected }
  }

  const onPlot = async () => {
    if (!isRouteApiConfigured()) {
      toast('Set VITE_APP_API_URL to enable geocoding')
      return
    }
    if (dayJobs.length === 0) {
      toast('No jobs on this day')
      return
    }
    setBusy(true)
    try {
      const { plottable, skipped, depot, corrected } = await ensureCoords({ refresh: true })
      if (plottable.length === 0 && !depot) {
        toast(skipped.length ? 'Could not geocode any stops' : 'Add client addresses first')
        return
      }
      const parts = [
        `Plotted ${plottable.length} stop${plottable.length === 1 ? '' : 's'}`,
        skipped.length ? `skipped ${skipped.length}` : '',
        corrected ? `updated ${corrected} address${corrected === 1 ? '' : 'es'}` : '',
      ].filter(Boolean)
      toast(parts.join(' · '))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Plot failed')
    } finally {
      setBusy(false)
    }
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
      setRoadGeometry(result.geometry?.length && result.geometry.length >= 2 ? result.geometry : null)
      if (skipped.length) {
        toast(`Optimized · skipped ${skipped.length} without map pin`)
      } else {
        toast(
          result.duration_minutes != null
            ? `Optimized · ~${formatDriveDuration(result.duration_minutes)} drive`
            : 'Route optimized',
        )
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Optimize failed')
    } finally {
      setBusy(false)
    }
  }

  const emptyHint =
    dayJobs.length === 0
      ? undefined
      : needsPlot
        ? 'Addresses need geocoding — Plot stops to drop pins.'
        : undefined

  const dockStatus: DockStatus = !isRouteApiConfigured()
    ? 'api-missing'
    : busy
      ? 'busy'
      : needsPlot
        ? 'partial'
        : roadGeometry
          ? 'road'
          : 'idle'

  const apiOk = isRouteApiConfigured()

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Map stage — real Leaflet map fills this pane; Bolt chrome overlays it */}
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <RouteMap
            jobs={dayJobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            depot={depotCoords}
            roadGeometry={roadGeometry}
            emptyHint={emptyHint}
            className="h-full w-full rounded-none border-0"
            emptyHero={variant === 'empty'}
          />

          {variant !== 'empty' ? (
            <div className="absolute bottom-5 left-1/2 z-[520] max-w-[calc(100%-2rem)] -translate-x-1/2">
              <ActionDock
                stopCount={dayJobs.length}
                plottedCount={plottedCount}
                unplotCount={unplotCount}
                status={dockStatus}
                onPlot={() => void onPlot()}
                onOptimize={() => void onOptimize()}
                plotDisabled={!apiOk || dayJobs.length === 0}
                optimizeDisabled={dayJobs.length < 2}
                variant={variant}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Run sheet */}
      <aside className="flex h-full w-[min(380px,38%)] shrink-0 flex-col border-l border-ink-200/80 bg-white">
        {variant === 'empty' ? (
          <EmptyRunSheet
            dateLabel={`${weekday}, ${dateLabel}`}
            onSchedule={onSchedule}
            hasDepot={Boolean(businessAddress.trim())}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-ink-200/80 px-5 py-3">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
                  Run sheet
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-ink-500">
                  {dayJobs.length} stop{dayJobs.length === 1 ? '' : 's'} · drag to reorder
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  variant === 'needsplot'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-brand-100 text-brand-700'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    variant === 'needsplot' ? 'bg-amber-500' : 'bg-brand-500'
                  }`}
                />
                {variant === 'needsplot' ? 'Draft' : 'Sequenced'}
              </div>
            </div>

            <div className="routes-scroll-thin flex-1 space-y-2 overflow-y-auto px-4 py-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => void onDragEnd(e)}
              >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {cardModels.map((stop, idx) => (
                    <SortableStopCard
                      key={stop.id}
                      stop={stop}
                      index={idx}
                      selected={stop.id === selectedJobId}
                      onSelect={() => setSelectedJobId(stop.id)}
                      isLast={idx === cardModels.length - 1}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {onSchedule ? (
                <button
                  type="button"
                  onClick={onSchedule}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 py-2 text-[11px] font-bold text-ink-400 transition hover:border-brand-300 hover:text-brand-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Schedule another stop
                </button>
              ) : null}

              {!businessAddress.trim() ? (
                <p className="pt-1 text-[10px] text-ink-400">
                  Tip: set Business Address in Settings for a depot start/end.
                </p>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
