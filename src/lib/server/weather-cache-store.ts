import { escapeFilterValue } from '@/lib/api/mappers'
import type { DayForecast } from '@/lib/weather-risk'
import { authenticateServerAdmin } from './pocketbase-admin'

export type WeatherCacheKind = 'geocode' | 'forecast'

interface GeoCoords {
  lat: number
  lon: number
}

interface L1Entry<T> {
  cachedOn: string
  value: T
}

/** Process-local L1 — dedupes within a single serverless invocation. */
const l1Geocode = new Map<string, L1Entry<GeoCoords | null>>()
const l1Forecast = new Map<string, L1Entry<DayForecast>>()

function l1Key(kind: WeatherCacheKind, cacheKey: string): string {
  return `${kind}:${cacheKey}`
}

function readL1Geocode(cacheKey: string, cachedOn: string): GeoCoords | null | undefined {
  const entry = l1Geocode.get(l1Key('geocode', cacheKey))
  if (!entry) return undefined
  if (entry.cachedOn !== cachedOn) {
    l1Geocode.delete(l1Key('geocode', cacheKey))
    return undefined
  }
  return entry.value
}

function writeL1Geocode(cacheKey: string, cachedOn: string, value: GeoCoords | null): void {
  l1Geocode.set(l1Key('geocode', cacheKey), { cachedOn, value })
}

function readL1Forecast(cacheKey: string, cachedOn: string): DayForecast | undefined {
  const entry = l1Forecast.get(l1Key('forecast', cacheKey))
  if (!entry) return undefined
  if (entry.cachedOn !== cachedOn) {
    l1Forecast.delete(l1Key('forecast', cacheKey))
    return undefined
  }
  return entry.value
}

function writeL1Forecast(cacheKey: string, cachedOn: string, value: DayForecast): void {
  l1Forecast.set(l1Key('forecast', cacheKey), { cachedOn, value })
}

function parseGeocodePayload(raw: unknown): GeoCoords | null {
  if (raw == null) return null
  if (typeof raw !== 'object') return null
  const row = raw as { lat?: unknown; lon?: unknown }
  if (typeof row.lat !== 'number' || typeof row.lon !== 'number') return null
  return { lat: row.lat, lon: row.lon }
}

function parseForecastPayload(raw: unknown): DayForecast | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Partial<DayForecast>
  if (
    typeof row.date !== 'string' ||
    typeof row.precipChance !== 'number' ||
    typeof row.tempMaxF !== 'number' ||
    typeof row.weatherCode !== 'number'
  ) {
    return null
  }
  return {
    date: row.date,
    precipChance: row.precipChance,
    tempMaxF: row.tempMaxF,
    weatherCode: row.weatherCode,
  }
}

async function readPbCache(
  kind: WeatherCacheKind,
  cacheKey: string,
  cachedOn: string,
): Promise<unknown | undefined> {
  try {
    const pb = await authenticateServerAdmin()
    const filter = `kind = "${kind}" && cache_key = "${escapeFilterValue(cacheKey)}" && cached_on = "${cachedOn}"`
    const records = await pb.collection('weather_cache').getFullList({
      filter,
      limit: 1,
    })
    if (records.length === 0) return undefined
    return records[0].payload
  } catch {
    return undefined
  }
}

async function writePbCache(
  kind: WeatherCacheKind,
  cacheKey: string,
  cachedOn: string,
  payload: unknown,
): Promise<void> {
  try {
    const pb = await authenticateServerAdmin()
    const filter = `kind = "${kind}" && cache_key = "${escapeFilterValue(cacheKey)}"`
    const existing = await pb.collection('weather_cache').getFullList({ filter, limit: 1 })
    const body = { kind, cache_key: cacheKey, cached_on: cachedOn, payload }

    if (existing.length > 0) {
      await pb.collection('weather_cache').update(existing[0].id, body)
      return
    }

    await pb.collection('weather_cache').create(body)
  } catch {
    // PB unavailable — L1 still helps within this invocation.
  }
}

/** `undefined` = cache miss. */
export async function readGeocodeCache(
  cacheKey: string,
  cachedOn: string,
): Promise<GeoCoords | null | undefined> {
  const l1 = readL1Geocode(cacheKey, cachedOn)
  if (l1 !== undefined) return l1

  const raw = await readPbCache('geocode', cacheKey, cachedOn)
  if (raw === undefined) return undefined

  const value = parseGeocodePayload(raw)
  writeL1Geocode(cacheKey, cachedOn, value)
  return value
}

export async function writeGeocodeCache(
  cacheKey: string,
  cachedOn: string,
  value: GeoCoords | null,
): Promise<void> {
  writeL1Geocode(cacheKey, cachedOn, value)
  await writePbCache('geocode', cacheKey, cachedOn, value)
}

export async function readForecastCache(
  cacheKey: string,
  cachedOn: string,
): Promise<DayForecast | undefined> {
  const l1 = readL1Forecast(cacheKey, cachedOn)
  if (l1) return l1

  const raw = await readPbCache('forecast', cacheKey, cachedOn)
  if (raw === undefined) return undefined

  const value = parseForecastPayload(raw)
  if (!value) return undefined

  writeL1Forecast(cacheKey, cachedOn, value)
  return value
}

export async function writeForecastCache(
  cacheKey: string,
  cachedOn: string,
  value: DayForecast,
): Promise<void> {
  writeL1Forecast(cacheKey, cachedOn, value)
  await writePbCache('forecast', cacheKey, cachedOn, value)
}

export function __clearWeatherCachesForTests(): void {
  l1Geocode.clear()
  l1Forecast.clear()
}
