import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  AttributionControl,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from '@/theme/colors'
import type { DeskJob } from '@/lib/types'

/** Same-origin proxy — see vite.config.ts `/map-tiles/carto`.
 * `{r}` → `@2x` on retina so Carto serves 512px tiles (avoids soft 1× stretch). */
const TILE_URL = '/map-tiles/carto/{z}/{x}/{y}{r}.png'

type Props = {
  jobs: DeskJob[]
  selectedJobId?: string | null
  onSelectJob?: (jobId: string) => void
  depot?: { lat: number; lng: number } | null
  roadGeometry?: Array<[number, number]> | null
  emptyHint?: string
  className?: string
  /** Creative empty-day hero over the map stage (no pins yet). */
  emptyHero?: boolean
}

function isPlottableCoord(
  lat: unknown,
  lng: unknown,
): lat is number {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  // PB/defaults often store 0,0 — treat as ungeocoded (null island).
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return true
}

function asLatLng(lat: unknown, lng: unknown): [number, number] | null {
  if (!isPlottableCoord(lat, lng)) return null
  return [lat, lng as number]
}

function collectLatLngs(
  jobs: DeskJob[],
  depot?: { lat: number; lng: number } | null,
): Array<[number, number]> {
  const points: Array<[number, number]> = []
  const depotPt = depot ? asLatLng(depot.lat, depot.lng) : null
  if (depotPt) points.push(depotPt)
  for (const j of jobs) {
    const pt = asLatLng(j.client?.lat, j.client?.lng)
    if (pt) points.push(pt)
  }
  return points
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0]!, 12)
      return
    }
    map.fitBounds(L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng))), {
      padding: [56, 56],
      maxZoom: 14,
    })
  }, [map, points])

  // Flex / overlay layout often sizes the pane after first paint
  useEffect(() => {
    const el = map.getContainer()
    const invalidate = () => map.invalidateSize()
    const t1 = window.setTimeout(invalidate, 50)
    const t2 = window.setTimeout(invalidate, 250)
    const t3 = window.setTimeout(invalidate, 600)
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => invalidate()) : null
    ro?.observe(el)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      ro?.disconnect()
    }
  }, [map])

  return null
}

function stopIcon(index: number, selected: boolean) {
  const bg = selected ? colors.greenDark : colors.green
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${bg};color:#fff;font:700 11px/1 system-ui,sans-serif;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);
      ${selected ? 'transform:scale(1.1);' : ''}
    ">${index + 1}</div>`,
  })
}

function depotIcon() {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${colors.greenDark};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.25);
    " title="Depot">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/>
      </svg>
    </div>`,
  })
}

export default function RouteMap({
  jobs,
  selectedJobId,
  onSelectJob,
  depot,
  roadGeometry,
  emptyHint,
  className,
  emptyHero = false,
}: Props) {
  /** Only after Optimize — no straight-line preview. Leaflet wants [lat, lng]; OSRM is [lng, lat]. */
  const lineLatLng = useMemo((): Array<[number, number]> => {
    if (!roadGeometry || roadGeometry.length < 2) return []
    return roadGeometry.map(([lng, lat]) => [lat, lng])
  }, [roadGeometry])

  const points = useMemo(() => collectLatLngs(jobs, depot), [jobs, depot])
  const hasPins = points.length > 0

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden bg-[#e8eef2] ${className ?? ''}`}>
      <MapContainer
        center={[33.749, -84.388]}
        zoom={11}
        className="absolute inset-0 z-0 h-full w-full"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        attributionControl={false}
      >
        <AttributionControl position="bottomleft" prefix={false} />
        <TileLayer
          url={TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
          maxNativeZoom={19}
        />
        <FitBounds points={points} />

        {lineLatLng.length >= 2 ? (
          <>
            <Polyline
              positions={lineLatLng}
              pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
            />
            <Polyline
              positions={lineLatLng}
              pathOptions={{
                color: colors.green,
                weight: 4,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        ) : null}

        {depot && isPlottableCoord(depot.lat, depot.lng) ? (
          <Marker position={[depot.lat, depot.lng]} icon={depotIcon()} />
        ) : null}

        {jobs.map((job, index) => {
          const pt = asLatLng(job.client?.lat, job.client?.lng)
          if (!pt) {
            return null
          }
          const selected = job.id === selectedJobId
          return (
            <Marker
              key={job.id}
              position={pt}
              icon={stopIcon(index, selected)}
              eventHandlers={{
                click: () => onSelectJob?.(job.id),
              }}
            />
          )
        })}
      </MapContainer>

      {emptyHero && !hasPins ? (
        <div className="pointer-events-none absolute inset-0 z-[480] flex items-center justify-center bg-[#e7ece7]/70">
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-brand-100/50 blur-2xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-brand-400/50 bg-white/70 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-brand-400"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="absolute -bottom-9 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-brand-600/80">
                A blank route
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {!hasPins && !emptyHero && emptyHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-3 z-[500]">
          <p className="rounded-lg bg-white/95 border border-ink-200 px-3 py-2 text-[11px] text-ink-600 shadow-sm max-w-md text-center">
            {emptyHint}
          </p>
        </div>
      ) : null}

      {!hasPins && !emptyHero && !emptyHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-3 z-[500]">
          <p className="rounded-lg bg-white/95 border border-ink-200 px-3 py-2 text-[11px] text-ink-600 shadow-sm max-w-md text-center">
            Plot stops to drop pins → Optimize for road order & path.
          </p>
        </div>
      ) : null}
    </div>
  )
}
