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

function appleMapsPoint(stop: AppleMapsStop): string | null {
  if (
    stop.lat != null &&
    stop.lng != null &&
    Number.isFinite(stop.lat) &&
    Number.isFinite(stop.lng)
  ) {
    return `${stop.lat},${stop.lng}`
  }
  const address = stop.address?.trim()
  return address ? address : null
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
  const points = stops
    .map(appleMapsPoint)
    .filter((point): point is string => Boolean(point))

  if (points.length === 0) {
    return { ok: false, reason: 'no_stops' }
  }

  const depot = opts?.depotAddress?.trim() || ''
  const params = new URLSearchParams()
  params.set('mode', 'driving')

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
  if (depot) {
    params.set('source', depot)
  }
  params.set('destination', destination)
  for (const waypoint of waypoints) {
    params.append('waypoint', waypoint)
  }

  return {
    ok: true,
    url: `https://maps.apple.com/directions?${params.toString()}`,
    truncated,
    omittedCount,
  }
}
