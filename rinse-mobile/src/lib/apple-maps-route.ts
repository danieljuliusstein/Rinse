/** Apple Maps multi-stop cap includes source + destination ends. */
export const APPLE_MAPS_MAX_ROUTE_POINTS = 15

export type AppleMapsStop = {
  address?: string | null
  lat?: number | null
  lng?: number | null
}

export type AppleMapsDayRouteResult =
  | { ok: true; url: string; truncated: boolean; omittedCount: number }
  | { ok: false; reason: 'no_stops' }

/**
 * Prefer the address string the operator sees over cached coords.
 * Stale/wrong lat,lng pins are a common cause of “wrong address” in Maps.
 * Fall back to coords only when there is no address text.
 */
function appleMapsPoint(stop: AppleMapsStop): string | null {
  const address = stop.address?.trim()
  if (address) return address
  if (
    stop.lat != null &&
    stop.lng != null &&
    Number.isFinite(stop.lat) &&
    Number.isFinite(stop.lng)
  ) {
    return `${stop.lat},${stop.lng}`
  }
  return null
}

function pointKey(point: string): string {
  return point.trim().toLowerCase()
}

/** Collapse A→A→B into A→B so shop + garage source don’t double up. */
function dedupeConsecutive(points: string[]): string[] {
  const out: string[] = []
  for (const point of points) {
    const prev = out[out.length - 1]
    if (prev != null && pointKey(prev) === pointKey(point)) continue
    out.push(point)
  }
  return out
}

/**
 * Apple Maps expects percent-encoding (`%20`), not form-urlencoded (`+`).
 * `URLSearchParams` uses `+` for spaces, which often geocodes to the wrong place.
 */
function appleMapsQuery(params: Array<[string, string]>): string {
  return params
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * Unified Apple Maps directions URL for a full-day route (iOS 18.4+).
 * Depot set → start at depot, then stops in order (destination = last stop).
 * No depot → current location start, destination = last stop, earlier stops as waypoints.
 *
 * Do not set destination=depot: that doubles the shop as a return leg and makes
 * Apple Maps show N+2 points for N job stops (confusing vs the "N stops" UI).
 */
export function appleMapsDayRouteUrl(
  stops: AppleMapsStop[],
  opts?: { depotAddress?: string | null },
): AppleMapsDayRouteResult {
  const depot = opts?.depotAddress?.trim() || ''
  let points = dedupeConsecutive(
    stops.map(appleMapsPoint).filter((point): point is string => Boolean(point)),
  )

  // Garage is already `source` — drop leading job stops that are the same place.
  if (depot) {
    const depotKey = pointKey(depot)
    while (points.length > 0 && pointKey(points[0]!) === depotKey) {
      points = points.slice(1)
    }
  }

  if (points.length === 0) {
    return { ok: false, reason: 'no_stops' }
  }

  let truncated = false
  let omittedCount = 0

  // Cap: optional source + destination + waypoints ≤ APPLE_MAPS_MAX_ROUTE_POINTS
  const maxStops = depot
    ? APPLE_MAPS_MAX_ROUTE_POINTS - 1 // source takes one slot; dest is last stop
    : APPLE_MAPS_MAX_ROUTE_POINTS
  let routeStops = points
  if (routeStops.length > maxStops) {
    truncated = true
    omittedCount = routeStops.length - maxStops
    routeStops = routeStops.slice(0, maxStops)
  }

  const destination = routeStops[routeStops.length - 1]!
  const waypoints = routeStops.slice(0, -1)
  const query: Array<[string, string]> = [['mode', 'driving']]
  if (depot) {
    query.push(['source', depot])
  }
  query.push(['destination', destination])
  for (const waypoint of waypoints) {
    query.push(['waypoint', waypoint])
  }

  return {
    ok: true,
    url: `https://maps.apple.com/directions?${appleMapsQuery(query)}`,
    truncated,
    omittedCount,
  }
}
