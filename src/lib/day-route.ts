import { Alert, Linking } from 'react-native'
import type { JobWithRelations } from '@rinse/core'
import { appleMapsDayRouteUrl, type AppleMapsStop } from '@/src/lib/apple-maps-route'

export function appleMapsStopsFromJobs(jobs: JobWithRelations[]): AppleMapsStop[] {
  return jobs.map((job) => ({
    address: job.client?.address,
    lat: job.client?.lat,
    lng: job.client?.lng,
  }))
}

/** True when at least one stop has an address or coords for Maps. */
export function dayRouteHasUsableStops(jobs: JobWithRelations[]): boolean {
  return appleMapsStopsFromJobs(jobs).some((stop) => {
    if (
      stop.lat != null &&
      stop.lng != null &&
      Number.isFinite(stop.lat) &&
      Number.isFinite(stop.lng)
    ) {
      return true
    }
    return Boolean(stop.address?.trim())
  })
}

export async function openDayRouteInAppleMaps(
  jobs: JobWithRelations[],
  opts?: {
    depotAddress?: string | null
    noStopsTitle?: string
    noStopsBody?: string
    truncatedTitle?: string
    truncatedBody?: (omittedCount: number) => string
  },
): Promise<boolean> {
  // #region agent log
  const stopSummary = jobs.map((j) => ({
    id: j.id,
    date: j.date,
    name: j.client?.name ?? null,
    hasAddress: Boolean(j.client?.address?.trim()),
    hasCoords: j.client?.lat != null && j.client?.lng != null,
  }))
  const depotSet = Boolean(opts?.depotAddress?.trim())
  if (typeof fetch !== 'undefined') {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://127.0.0.1:8081'
    fetch(`${origin}/__agent-debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
      body: JSON.stringify({
        sessionId: '89a058',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: 'day-route.ts:openDayRouteInAppleMaps',
        message: 'Start route input jobs',
        data: {
          jobCount: jobs.length,
          depotSet,
          depotLen: opts?.depotAddress?.trim()?.length ?? 0,
          stops: stopSummary,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion

  const result = appleMapsDayRouteUrl(appleMapsStopsFromJobs(jobs), {
    depotAddress: opts?.depotAddress,
  })

  if (!result.ok) {
    Alert.alert(
      opts?.noStopsTitle ?? 'Start route',
      opts?.noStopsBody ?? 'No stops have an address or map pin yet.',
    )
    return false
  }

  // #region agent log
  if (typeof fetch !== 'undefined') {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://127.0.0.1:8081'
    let source = ''
    let destination = ''
    let waypointCount = 0
    try {
      const u = new URL(result.url)
      source = u.searchParams.get('source') ?? ''
      destination = u.searchParams.get('destination') ?? ''
      waypointCount = u.searchParams.getAll('waypoint').length
    } catch {
      /* ignore */
    }
    const mapPointCount =
      (source ? 1 : 0) + (destination ? 1 : 0) + waypointCount
    fetch(`${origin}/__agent-debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '89a058' },
      body: JSON.stringify({
        sessionId: '89a058',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: 'day-route.ts:openDayRouteInAppleMaps',
        message: 'Apple Maps URL built',
        data: {
          truncated: result.truncated,
          omittedCount: result.omittedCount,
          sourceSet: Boolean(source),
          destinationPreview: destination.slice(0, 40),
          waypointCount,
          mapPointCount,
          urlLen: result.url.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion

  if (result.truncated) {
    const body =
      opts?.truncatedBody?.(result.omittedCount) ??
      `Apple Maps supports a limited number of stops. Opening the first ${jobs.length - result.omittedCount}; ${result.omittedCount} left off.`
    await new Promise<void>((resolve) => {
      Alert.alert(opts?.truncatedTitle ?? 'Route truncated', body, [
        { text: 'OK', onPress: () => resolve() },
      ])
    })
  }

  await Linking.openURL(result.url)
  return true
}
