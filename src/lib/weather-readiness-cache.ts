import {
  isWeatherReadinessActiveJob,
  isWeatherSensitiveJob,
  isoDate,
  nextThreeDayDates,
  type WeatherReadinessResult,
} from '@/lib/weather-risk'

const TTL_MS = 15 * 60 * 1000
const STALE_PAINT_MS = 60 * 60 * 1000
const STORAGE_KEY = 'rinse-weather-readiness'

interface CacheEntry {
  key: string
  fetchedAt: number
  data: WeatherReadinessResult
}

let entry: CacheEntry | null = null
let storageHydrated = false

function hydrateFromSessionStorage(): void {
  if (storageHydrated || typeof window === 'undefined') return
  storageHydrated = true
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.key || !parsed.data) return
    entry = parsed
  } catch {
    /* ignore corrupt cache */
  }
}

function persistToSessionStorage(next: CacheEntry): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}

export function buildWeatherReadinessFetchKey(
  jobs: { id: string; date: string; status?: string; location_type: string }[],
): string {
  const today = isoDate(new Date())
  const window = new Set(nextThreeDayDates())
  const jobKey = jobs
    .filter(
      (j) =>
        isWeatherReadinessActiveJob(j) &&
        isWeatherSensitiveJob(j) &&
        window.has(j.date),
    )
    .map((j) => `${j.id}:${j.date}`)
    .sort()
    .join('|')
  return `${today}|${jobKey}`
}

/** Return cached readiness for instant paint (includes slightly stale data). */
export function peekWeatherReadinessCache(key: string): WeatherReadinessResult | null {
  hydrateFromSessionStorage()
  if (!entry || entry.key !== key) return null
  return entry.data
}

/**
 * Best-effort cache for first paint: exact key, else same-day entry within stale window.
 */
export function peekWeatherReadinessCacheForPaint(key: string): WeatherReadinessResult | null {
  hydrateFromSessionStorage()
  if (!entry) return null
  if (entry.key === key) return entry.data
  const today = isoDate(new Date())
  if (!entry.key.startsWith(`${today}|`)) return null
  if (Date.now() - entry.fetchedAt > STALE_PAINT_MS) return null
  return entry.data
}

/** Return cache only if still within TTL. */
export function getFreshWeatherReadinessCache(key: string): WeatherReadinessResult | null {
  hydrateFromSessionStorage()
  if (!entry || entry.key !== key) return null
  if (Date.now() - entry.fetchedAt > TTL_MS) return null
  return entry.data
}

export function setWeatherReadinessCache(key: string, data: WeatherReadinessResult): void {
  entry = { key, fetchedAt: Date.now(), data }
  persistToSessionStorage(entry)
}

export function clearWeatherReadinessCache(): void {
  entry = null
  storageHydrated = true
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}
