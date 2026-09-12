import { Alert, Linking } from 'react-native'
import type { JobWithRelations } from '@rinse/core'
import { appleMapsDayRouteUrl, type AppleMapsStop } from '@/src/lib/apple-maps-route'

/**
 * Build Maps stops for today’s jobs.
 * Shop (`fixed`) jobs happen at the garage — use depot, not the client’s home.
 */
export function appleMapsStopsFromJobs(
  jobs: JobWithRelations[],
  opts?: { depotAddress?: string | null },
): AppleMapsStop[] {
  const depot = opts?.depotAddress?.trim() || ''
  return jobs.map((job) => {
    if (job.location_type === 'fixed') {
      return depot ? { address: depot } : {}
    }
    return {
      address: job.client?.address,
      lat: job.client?.lat,
      lng: job.client?.lng,
    }
  })
}

/** True when at least one stop has an address or coords for Maps. */
export function dayRouteHasUsableStops(
  jobs: JobWithRelations[],
  opts?: { depotAddress?: string | null },
): boolean {
  return appleMapsStopsFromJobs(jobs, opts).some((stop) => {
    if (stop.address?.trim()) return true
    if (
      stop.lat != null &&
      stop.lng != null &&
      Number.isFinite(stop.lat) &&
      Number.isFinite(stop.lng)
    ) {
      return true
    }
    return false
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
  const result = appleMapsDayRouteUrl(appleMapsStopsFromJobs(jobs, opts), {
    depotAddress: opts?.depotAddress,
  })

  if (!result.ok) {
    Alert.alert(
      opts?.noStopsTitle ?? 'Start route',
      opts?.noStopsBody ?? 'No stops have an address or map pin yet.',
    )
    return false
  }

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
