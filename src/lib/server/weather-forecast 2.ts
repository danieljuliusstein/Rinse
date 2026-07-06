import {
  addressCacheKey,
  buildWeatherReadiness,
  geocodeQueryCandidates,
  isoDate,
  nextThreeDayDates,
  roundCoord,
  weatherCacheKey,
  type DayForecast,
  type WeatherJobInput,
  type WeatherReadinessResult,
} from '@/lib/weather-risk'

interface GeoCoords {
  lat: number
  lon: number
}

interface CacheEntry<T> {
  day: string
  value: T
}

/** In-memory caches: at most one geocode per address and one forecast per day+coords (2dp). */
const geocodeCache = new Map<string, CacheEntry<GeoCoords | null>>()
const forecastCache = new Map<string, CacheEntry<DayForecast>>()

function todayKey(now = new Date()): string {
  return isoDate(now)
}

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string, day: string): T | undefined {
  const entry = map.get(key)
  if (!entry) return undefined
  if (entry.day !== day) {
    map.delete(key)
    return undefined
  }
  return entry.value
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, day: string, value: T): void {
  map.set(key, { day, value })
}

async function geocodePlaceName(name: string): Promise<GeoCoords | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  try {
    const res = await fetch(url.toString(), { cache: 'force-cache' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: Array<{ latitude?: number; longitude?: number }>
    }
    const hit = data.results?.[0]
    if (hit?.latitude == null || hit?.longitude == null) return null
    return { lat: hit.latitude, lon: hit.longitude }
  } catch {
    return null
  }
}

/**
 * Geocode via Open-Meteo (no API key). Street lines are reduced to city/place
 * candidates — Open-Meteo does not resolve full US street addresses.
 * Cached once per day per original address string.
 */
export async function geocodeAddress(address: string, now = new Date()): Promise<GeoCoords | null> {
  const trimmed = address.trim()
  if (!trimmed) return null

  const day = todayKey(now)
  const key = addressCacheKey(trimmed)
  const cached = getCached(geocodeCache, key, day)
  if (cached !== undefined) return cached

  let coords: GeoCoords | null = null
  for (const candidate of geocodeQueryCandidates(trimmed)) {
    coords = await geocodePlaceName(candidate)
    if (coords) break
  }

  setCached(geocodeCache, key, day, coords)
  return coords
}

/**
 * Daily forecast for a lat/lon. Cached once per calendar day per rounded coords.
 * Uses Open-Meteo (no API key).
 */
export async function fetchDayForecast(
  lat: number,
  lon: number,
  date: string,
  now = new Date(),
): Promise<DayForecast | null> {
  const day = todayKey(now)
  const key = weatherCacheKey(date, lat, lon)
  const cached = getCached(forecastCache, key, day)
  if (cached) return cached

  const rLat = roundCoord(lat)
  const rLon = roundCoord(lon)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(rLat))
  url.searchParams.set('longitude', String(rLon))
  url.searchParams.set(
    'daily',
    'precipitation_probability_max,weather_code,temperature_2m_max',
  )
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('start_date', date)
  url.searchParams.set('end_date', date)

  try {
    const res = await fetch(url.toString(), { cache: 'force-cache' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      daily?: {
        time?: string[]
        precipitation_probability_max?: Array<number | null>
        weather_code?: Array<number | null>
        temperature_2m_max?: Array<number | null>
      }
    }
    const times = data.daily?.time ?? []
    const idx = times.indexOf(date)
    if (idx < 0) return null

    const precip = data.daily?.precipitation_probability_max?.[idx]
    const code = data.daily?.weather_code?.[idx]
    const temp = data.daily?.temperature_2m_max?.[idx]
    if (precip == null || code == null || temp == null) return null

    const forecast: DayForecast = {
      date,
      precipChance: precip,
      tempMaxF: temp,
      weatherCode: code,
    }
    setCached(forecastCache, key, day, forecast)
    return forecast
  } catch {
    return null
  }
}

/**
 * Resolve per-job forecasts. Geocode is cached by address; weather by day + lat/lon (2dp)
 * so nearby jobs share one Open-Meteo call.
 */
export async function resolveForecastsForJobs(
  jobs: WeatherJobInput[],
  now = new Date(),
): Promise<Map<string, DayForecast>> {
  const dates = new Set(nextThreeDayDates(now))
  const byJobId = new Map<string, DayForecast>()

  const addresses = new Set<string>()
  for (const job of jobs) {
    if (!dates.has(job.date)) continue
    const address = job.address?.trim()
    if (address) addresses.add(address)
  }

  const coordByAddress = new Map<string, GeoCoords | null>()
  await Promise.all(
    [...addresses].map(async (address) => {
      coordByAddress.set(address, await geocodeAddress(address, now))
    }),
  )

  // Unique day+coords fetches (rounded) — one network call per cache key.
  const forecastByKey = new Map<string, Promise<DayForecast | null>>()

  function forecastPromise(lat: number, lon: number, date: string): Promise<DayForecast | null> {
    const key = weatherCacheKey(date, lat, lon)
    let pending = forecastByKey.get(key)
    if (!pending) {
      pending = fetchDayForecast(lat, lon, date, now)
      forecastByKey.set(key, pending)
    }
    return pending
  }

  await Promise.all(
    jobs.map(async (job) => {
      if (!dates.has(job.date)) return
      const address = job.address?.trim()
      if (!address) return
      const coords = coordByAddress.get(address)
      if (!coords) return
      const forecast = await forecastPromise(coords.lat, coords.lon, job.date)
      if (forecast) byJobId.set(job.id, forecast)
    }),
  )

  return byJobId
}

/**
 * Build readiness for Home. Jobs without a geocodable address are skipped for forecasts;
 * if none remain weather-sensitive with data, returns null (render nothing).
 */
export async function buildWeatherReadinessForJobs(
  jobs: WeatherJobInput[],
  now = new Date(),
): Promise<WeatherReadinessResult | null> {
  const todayStr = isoDate(now)
  const forecasts = await resolveForecastsForJobs(jobs, now)
  return buildWeatherReadiness(jobs, forecasts, todayStr)
}

/** Test helpers — clear process-local caches. */
export function __clearWeatherCachesForTests(): void {
  geocodeCache.clear()
  forecastCache.clear()
}
