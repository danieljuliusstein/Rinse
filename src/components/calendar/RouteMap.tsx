import { useEffect, useMemo, useRef } from 'react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors } from '@/theme/colors'
import type { DeskJob } from '@/lib/types'
import { lineCoordsFromStops } from '@/lib/route-optimize'

const FALLBACK_STYLE =
  'https://demotiles.maplibre.org/style.json'

type Props = {
  jobs: DeskJob[]
  selectedJobId?: string | null
  onSelectJob?: (jobId: string) => void
  depot?: { lat: number; lng: number } | null
  className?: string
}

export default function RouteMap({
  jobs,
  selectedJobId,
  onSelectJob,
  depot,
  className,
}: Props) {
  const mapRef = useRef<MapRef>(null)
  const styleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim() || FALLBACK_STYLE

  const plottable = useMemo(
    () =>
      jobs.filter((j) => {
        const lat = j.client?.lat
        const lng = j.client?.lng
        return lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      }),
    [jobs],
  )

  const line = useMemo(() => lineCoordsFromStops(jobs), [jobs])

  const geojson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: line.length >= 2 ? line : [],
      },
    }),
    [line],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const points: Array<[number, number]> = [...line]
    if (depot) points.push([depot.lng, depot.lat])
    if (points.length === 0) return
    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 12, duration: 400 })
      return
    }
    const lons = points.map((p) => p[0])
    const lats = points.map((p) => p[1])
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 48, duration: 500, maxZoom: 14 },
    )
  }, [line, depot])

  if (plottable.length === 0 && !depot) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500 ${className ?? ''}`}
      >
        Add client addresses to plot stops
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className ?? ''}`}>
      <Map
        ref={mapRef}
        mapStyle={styleUrl}
        initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 3.5 }}
        style={{ width: '100%', height: '100%', minHeight: 220 }}
        attributionControl={false}
      >
        {line.length >= 2 ? (
          <Source id="route-line" type="geojson" data={geojson}>
            <Layer
              id="route-line-layer"
              type="line"
              paint={{
                'line-color': colors.green,
                'line-width': 3.5,
                'line-opacity': 0.85,
              }}
            />
          </Source>
        ) : null}

        {depot ? (
          <Marker longitude={depot.lng} latitude={depot.lat} anchor="bottom">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md"
              style={{ background: colors.greenDark }}
              title="Depot"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
              </svg>
            </div>
          </Marker>
        ) : null}

        {jobs.map((job, index) => {
          const lat = job.client?.lat
          const lng = job.client?.lng
          if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null
          }
          const selected = job.id === selectedJobId
          return (
            <Marker key={job.id} longitude={lng} latitude={lat} anchor="bottom">
              <button
                type="button"
                onClick={() => onSelectJob?.(job.id)}
                className={`flex h-7 min-w-7 items-center justify-center rounded-full border-2 px-1.5 text-[11px] font-bold shadow-md transition-transform ${
                  selected ? 'scale-110 border-white' : 'border-white/90'
                }`}
                style={{
                  background: selected ? colors.greenDark : colors.green,
                  color: '#fff',
                }}
                title={job.client?.name ?? `Stop ${index + 1}`}
              >
                {index + 1}
              </button>
            </Marker>
          )
        })}
      </Map>
    </div>
  )
}
