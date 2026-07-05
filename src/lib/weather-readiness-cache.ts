import type { WeatherReadinessResult } from '@/lib/weather-risk'

const TTL_MS = 15 * 60 * 1000

interface CacheEntry {
  key: string
  fetchedAt: number
  data: WeatherReadinessResult
}

let entry: CacheEntry | null = null

/** Return cached readiness for instant paint (includes slightly stale data). */
export function peekWeatherReadinessCache(key: string): WeatherReadinessResult | null {
  if (!entry || entry.key !== key) return null
  return entry.data
}

/** Return cache only if still within TTL. */
export function getFreshWeatherReadinessCache(key: string): WeatherReadinessResult | null {
  if (!entry || entry.key !== key) return null
  if (Date.now() - entry.fetchedAt > TTL_MS) return null
  return entry.data
}

export function setWeatherReadinessCache(key: string, data: WeatherReadinessResult): void {
  entry = { key, fetchedAt: Date.now(), data }
}

export function clearWeatherReadinessCache(): void {
  entry = null
}
