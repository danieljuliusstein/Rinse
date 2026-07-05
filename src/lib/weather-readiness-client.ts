import { getAuthFetchHeaders } from '@/lib/pb-auth'
import { loadSettingsAsync } from '@/lib/settings'
import type { JobWithRelations } from '@/lib/types'
import type { WeatherJobInput, WeatherReadinessResult } from '@/lib/weather-risk'
import {
  fallbackWeatherPlace,
  isWeatherSensitiveJob,
  nextThreeDayDates,
  selectWeatherSensitiveJobs,
} from '@/lib/weather-risk'

function resolveAddress(
  job: JobWithRelations,
  businessAddress?: string,
  placeFallback?: string,
): string | undefined {
  const clientAddr = job.client?.address?.trim()
  if (clientAddr) return clientAddr
  const business = businessAddress?.trim()
  if (business) return business
  return placeFallback?.trim() || undefined
}

export function jobsToWeatherInputs(
  jobs: JobWithRelations[],
  businessAddress?: string,
  placeFallback?: string,
): WeatherJobInput[] {
  return jobs.map((j) => ({
    id: j.id,
    date: j.date,
    start_time: j.start_time,
    location_type: j.location_type,
    clientName: j.client?.name ?? 'Client',
    address: resolveAddress(j, businessAddress, placeFallback),
    status: j.status,
  }))
}

/** True when Home should attempt a readiness fetch (mobile jobs in the next 3 days). */
export function shouldFetchWeatherReadiness(jobs: JobWithRelations[]): boolean {
  return selectWeatherSensitiveJobs(jobsToWeatherInputs(jobs)).length > 0
}

export async function fetchWeatherReadiness(
  jobs: JobWithRelations[],
): Promise<WeatherReadinessResult | null> {
  if (!shouldFetchWeatherReadiness(jobs)) return null

  let businessAddress: string | undefined
  try {
    const settings = await loadSettingsAsync()
    businessAddress = settings.business_address?.trim() || undefined
  } catch {
    businessAddress = undefined
  }

  const placeFallback = fallbackWeatherPlace()
  const window = new Set(nextThreeDayDates())
  const payload = jobsToWeatherInputs(jobs, businessAddress, placeFallback).filter(
    (j) => isWeatherSensitiveJob(j) && window.has(j.date),
  )

  try {
    const res = await fetch('/api/weather/readiness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthFetchHeaders(),
      },
      body: JSON.stringify({ jobs: payload }),
    })

    if (!res.ok) {
      console.warn('[weather-readiness] API', res.status)
      return null
    }

    const data = (await res.json()) as { readiness?: WeatherReadinessResult | null }
    return data.readiness ?? null
  } catch (err) {
    console.warn('[weather-readiness] fetch failed', err)
    return null
  }
}
