import type { DeskJob } from './types'

/** Jobs for a calendar day (YYYY-MM-DD). */
export function jobsForDate(jobs: DeskJob[], date: string): DeskJob[] {
  return jobs.filter((j) => j.date === date)
}

export type RouteStopView = {
  job: DeskJob
  address: string
  plottable: boolean
  lat?: number
  lng?: number
}

export function buildRouteStops(jobs: DeskJob[]): RouteStopView[] {
  return jobs.map((job) => {
    const address = job.client?.address?.trim() ?? ''
    const lat = job.client?.lat
    const lng = job.client?.lng
    const plottable =
      Boolean(address) &&
      lat != null &&
      lng != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    return {
      job,
      address,
      plottable,
      lat: plottable ? lat : undefined,
      lng: plottable ? lng : undefined,
    }
  })
}

/** Apply optimized id order; append any jobs missing from orderedIds (unplottable). */
export function mergeOptimizedOrder(dayJobs: DeskJob[], orderedIds: string[]): string[] {
  const byId = new Map(dayJobs.map((j) => [j.id, j]))
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of orderedIds) {
    if (!byId.has(id) || seen.has(id)) continue
    out.push(id)
    seen.add(id)
  }
  for (const j of dayJobs) {
    if (!seen.has(j.id)) out.push(j.id)
  }
  return out
}

export function lineCoordsFromStops(
  orderedJobs: DeskJob[],
): Array<[number, number]> {
  const coords: Array<[number, number]> = []
  for (const j of orderedJobs) {
    const lat = j.client?.lat
    const lng = j.client?.lng
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      coords.push([lng, lat])
    }
  }
  return coords
}
