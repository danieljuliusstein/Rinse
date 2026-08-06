/**
 * OSRM trip (TSP) — reorder waypoints + return road-following GeoJSON geometry.
 * Called only from server (apps/api) — not from the browser.
 */

export type TripWaypoint = {
  id: string
  lat: number
  lng: number
}

export type TripResult = {
  orderedIds: string[]
  /** [lng, lat][] LineString along the road network when available */
  geometry?: Array<[number, number]>
  distance_meters?: number
  duration_minutes?: number
}

const OSRM_TRIP_BASE = 'https://router.project-osrm.org/trip/v1/driving'

/**
 * OSRM trip: `waypoints[i].waypoint_index` is the visit position of input i.
 * `idsByInputIndex[i]` is the stop id at input coordinate i (null for depot).
 */
export function orderIdsFromOsrmWaypoints(
  idsByInputIndex: Array<string | null>,
  waypoints: Array<{ waypoint_index?: number }>,
): string[] {
  if (idsByInputIndex.length !== waypoints.length) {
    throw new Error('waypoint count mismatch')
  }
  const trip = new Array<string | null>(waypoints.length)
  for (let i = 0; i < waypoints.length; i++) {
    const pos = waypoints[i]?.waypoint_index
    if (pos == null || pos < 0 || pos >= waypoints.length) {
      throw new Error('invalid waypoint_index')
    }
    trip[pos] = idsByInputIndex[i] ?? null
  }
  return trip.filter((id): id is string => id != null)
}

function extractLineCoords(geometry: unknown): Array<[number, number]> | undefined {
  if (!geometry || typeof geometry !== 'object') return undefined
  const g = geometry as { type?: string; coordinates?: unknown }
  if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
    const out: Array<[number, number]> = []
    for (const c of g.coordinates) {
      if (!Array.isArray(c) || c.length < 2) continue
      const lng = Number(c[0])
      const lat = Number(c[1])
      if (Number.isFinite(lng) && Number.isFinite(lat)) out.push([lng, lat])
    }
    return out.length >= 2 ? out : undefined
  }
  return undefined
}

export async function optimizeTripOrder(
  stops: TripWaypoint[],
  depot?: { lat: number; lng: number } | null,
): Promise<TripResult | null> {
  if (stops.length === 0) return { orderedIds: [] }
  if (stops.length === 1 && !depot) {
    return { orderedIds: [stops[0]!.id] }
  }

  const coords: Array<{ lat: number; lng: number; id: string | null }> = []
  if (depot) {
    coords.push({ lat: depot.lat, lng: depot.lng, id: null })
  }
  for (const s of stops) {
    coords.push({ lat: s.lat, lng: s.lng, id: s.id })
  }

  const path = coords.map((c) => `${c.lng},${c.lat}`).join(';')
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'false',
    annotations: 'false',
  })
  // OSRM trip: destination is only `any` | `last` (not `first`).
  // Depot as coordinate 0 + source=first + roundtrip → start/end at depot.
  if (depot) {
    params.set('source', 'first')
    params.set('destination', 'any')
    params.set('roundtrip', 'true')
  } else {
    params.set('roundtrip', 'false')
    params.set('source', 'first')
    params.set('destination', 'last')
  }

  const url = `${OSRM_TRIP_BASE}/${path}?${params.toString()}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return null

  const body = (await res.json()) as {
    code?: string
    waypoints?: Array<{ waypoint_index?: number; trips_index?: number }>
    trips?: Array<{
      distance?: number
      duration?: number
      geometry?: unknown
    }>
  }
  if (body.code !== 'Ok' || !body.waypoints?.length) return null

  const idsByInput = coords.map((c) => c.id)
  let orderedIds: string[]
  try {
    orderedIds = orderIdsFromOsrmWaypoints(idsByInput, body.waypoints)
  } catch {
    return null
  }
  if (orderedIds.length !== stops.length) return null

  const trip = body.trips?.[0]
  const seconds = Number(trip?.duration ?? 0)
  const meters = Number(trip?.distance ?? 0)

  return {
    orderedIds,
    geometry: extractLineCoords(trip?.geometry),
    duration_minutes: Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : undefined,
    distance_meters: Number.isFinite(meters) ? Math.round(meters) : undefined,
  }
}
