import type { LocationType } from './types'

/**
 * Option B outdoor signal: mobile jobs are weather-sensitive (on-site);
 * fixed/shop jobs are not. No PocketBase `is_outdoor` field.
 * Anything other than explicit `fixed` counts as mobile (default / legacy rows).
 */
export function isWeatherSensitiveJob(job: { location_type: LocationType | string }): boolean {
  return job.location_type !== 'fixed'
}

/** Precipitation chance thresholds for job readiness pills. */
export const WEATHER_RISK_THRESHOLDS = {
  /** 0–30% inclusive → Good to go */
  goodMax: 30,
  /** 31–60% inclusive → Rain risk; 61%+ → High rain risk */
  rainRiskMax: 60,
} as const

export type WeatherRiskStatus = 'good_to_go' | 'rain_risk' | 'high_rain_risk'

export type WeatherIconKind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow'

export interface WeatherJobInput {
  id: string
  date: string
  start_time?: string
  location_type: LocationType
  clientName: string
  address?: string
  /** When set, only scheduled / in_progress jobs are considered. */
  status?: string
}

export interface DayForecast {
  date: string
  precipChance: number
  tempMaxF: number
  weatherCode: number
}

/** Clear day — one row per date, job count in secondary (mock: "3 jobs scheduled"). */
export interface WeatherReadinessGoodRow {
  kind: 'good'
  date: string
  dayLabel: string
  primary: string
  secondary: string
  status: 'good_to_go'
  statusLabel: string
  icon: WeatherIconKind
  jobCount: number
  precipChance: number
  tempMaxF: number
}

/** At-risk day — one row per outdoor job. */
export interface WeatherReadinessRiskRow {
  kind: 'risk'
  jobId: string
  date: string
  dayLabel: string
  primary: string
  secondary: string
  status: 'rain_risk' | 'high_rain_risk'
  statusLabel: string
  icon: WeatherIconKind
  precipChance: number
  tempMaxF: number
}

export type WeatherReadinessRow = WeatherReadinessGoodRow | WeatherReadinessRiskRow

export interface WeatherReadinessResult {
  rows: WeatherReadinessRow[]
}

export function precipToStatus(precipChance: number): WeatherRiskStatus {
  const chance = Math.max(0, Math.min(100, Math.round(precipChance)))
  if (chance <= WEATHER_RISK_THRESHOLDS.goodMax) return 'good_to_go'
  if (chance <= WEATHER_RISK_THRESHOLDS.rainRiskMax) return 'rain_risk'
  return 'high_rain_risk'
}

export function isAtRiskStatus(status: WeatherRiskStatus): status is 'rain_risk' | 'high_rain_risk' {
  return status === 'rain_risk' || status === 'high_rain_risk'
}

export function statusLabel(status: WeatherRiskStatus): string {
  switch (status) {
    case 'good_to_go':
      return 'Good to go'
    case 'rain_risk':
      return 'Rain risk'
    case 'high_rain_risk':
      return 'High rain risk'
  }
}

/** Map WMO weather codes (Open-Meteo) to Phosphor icon kinds. */
export function weatherCodeToIcon(code: number, precipChance: number): WeatherIconKind {
  if (code >= 95) return 'storm'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 80 && code <= 82) return 'rain'
  if (precipChance > WEATHER_RISK_THRESHOLDS.goodMax) return 'rain'
  if (code >= 1 && code <= 3) return 'cloud'
  if (code >= 45 && code <= 48) return 'cloud'
  return 'sun'
}

export function nextThreeDayDates(today = new Date()): string[] {
  const dates: string[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(today)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + i)
    dates.push(isoDate(d))
  }
  return dates
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayLabelForDate(date: string, todayStr: string): string {
  if (date === todayStr) return 'Today'
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatStartTime(startTime?: string): string | null {
  if (!startTime?.trim()) return null
  const [h, m] = startTime.split(':').map(Number)
  if (Number.isNaN(h)) return null
  const dt = new Date()
  dt.setHours(h, m ?? 0, 0, 0)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Mock format: `Today · 89°, 10% rain` */
export function formatPrimaryLine(dayLabel: string, tempMaxF: number, precipChance: number): string {
  return `${dayLabel} · ${Math.round(tempMaxF)}°, ${Math.round(precipChance)}% rain`
}

export function formatSecondaryLine(clientName: string, startTime?: string): string {
  const time = formatStartTime(startTime)
  if (time) return `${clientName} · ${time} outdoor detail`
  return `${clientName} · outdoor detail`
}

export function formatJobCountLine(count: number): string {
  return count === 1 ? '1 job scheduled' : `${count} jobs scheduled`
}

/**
 * Mobile jobs dated in the next 3 days.
 * Includes completed/invoiced — Quick Add saves jobs as `completed`, and weather
 * still matters for outdoor work on that calendar day.
 */
export function selectWeatherSensitiveJobs(
  jobs: WeatherJobInput[],
  todayStr = isoDate(new Date()),
): WeatherJobInput[] {
  const window = new Set(nextThreeDayDates(new Date(todayStr + 'T12:00:00')))
  return jobs
    .filter((j) => isWeatherSensitiveJob(j) && window.has(j.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    })
}

/** Place-name fallback when client/business address is missing (Open-Meteo city search). */
export function fallbackWeatherPlace(timeZone?: string): string {
  const tz = timeZone ?? (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '')
  if (/Chicago|Menominee|Winnipeg|Mexico_City/i.test(tz)) return 'Chicago'
  if (/Denver|Phoenix|Boise|Edmonton/i.test(tz)) return 'Denver'
  if (/Los_Angeles|Vancouver|Tijuana/i.test(tz)) return 'Los Angeles'
  return 'Atlanta'
}

/**
 * Build Home readiness rows to match the Job readiness mock:
 * - Clear day → one row, secondary "N jobs scheduled", Good to go pill
 * - Risk day → one row per job, client · time outdoor detail, Rain risk pill
 * - High rain risk rows sort before other risk rows; then chronological
 * Returns null when there are no weather-sensitive jobs with forecasts.
 */
export function buildWeatherReadiness(
  jobs: WeatherJobInput[],
  forecastsByJobId: Map<string, DayForecast>,
  todayStr = isoDate(new Date()),
): WeatherReadinessResult | null {
  const sensitive = selectWeatherSensitiveJobs(jobs, todayStr)
  const withForecast = sensitive.filter((j) => forecastsByJobId.has(j.id))
  if (withForecast.length === 0) return null

  const byDate = new Map<string, WeatherJobInput[]>()
  for (const job of withForecast) {
    const list = byDate.get(job.date) ?? []
    list.push(job)
    byDate.set(job.date, list)
  }

  const chronological: WeatherReadinessRow[] = []
  const highRisk: WeatherReadinessRiskRow[] = []

  for (const date of [...byDate.keys()].sort()) {
    const dayJobs = byDate.get(date)!
    const forecast = forecastsByJobId.get(dayJobs[0].id)
    if (!forecast) continue

    const status = precipToStatus(forecast.precipChance)
    const dayLabel = dayLabelForDate(date, todayStr)
    const primary = formatPrimaryLine(dayLabel, forecast.tempMaxF, forecast.precipChance)
    const icon = weatherCodeToIcon(forecast.weatherCode, forecast.precipChance)

    if (isAtRiskStatus(status)) {
      for (const job of dayJobs) {
        const row: WeatherReadinessRiskRow = {
          kind: 'risk',
          jobId: job.id,
          date,
          dayLabel,
          primary,
          secondary: formatSecondaryLine(job.clientName, job.start_time),
          status,
          statusLabel: statusLabel(status),
          icon,
          precipChance: forecast.precipChance,
          tempMaxF: forecast.tempMaxF,
        }
        if (status === 'high_rain_risk') highRisk.push(row)
        else chronological.push(row)
      }
    } else {
      chronological.push({
        kind: 'good',
        date,
        dayLabel,
        primary,
        secondary: formatJobCountLine(dayJobs.length),
        status: 'good_to_go',
        statusLabel: statusLabel('good_to_go'),
        icon,
        jobCount: dayJobs.length,
        precipChance: forecast.precipChance,
        tempMaxF: forecast.tempMaxF,
      })
    }
  }

  // High rain risk leads; remaining rows stay chronological (mock: Today good → risk days).
  return { rows: [...highRisk, ...chronological] }
}

/** Round lat/lon for shared weather cache keys (nearby jobs share one call). */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100
}

export function weatherCacheKey(day: string, lat: number, lon: number): string {
  return `${day}:${roundCoord(lat).toFixed(2)},${roundCoord(lon).toFixed(2)}`
}

export function addressCacheKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Open-Meteo geocoding is place-name based — full street lines usually miss.
 * Prefer city (and city + region) candidates derived from a US-style address.
 */
export function geocodeQueryCandidates(address: string): string[] {
  const trimmed = address.trim()
  if (!trimmed) return []

  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const candidates: string[] = []

  if (parts.length >= 2) {
    // "1420 Peachtree St NE, Atlanta, GA 30309" → "Atlanta"
    const city = parts[parts.length - 2]
    if (city) candidates.push(city)

    // "Atlanta GA" (state without comma zip)
    const region = parts[parts.length - 1]?.replace(/\b\d{5}(-\d{4})?\b/g, '').trim()
    if (city && region) {
      const state = region.split(/\s+/)[0]
      if (state && state.length <= 3) candidates.push(`${city} ${state}`)
    }
  }

  // Bare city / place name
  if (parts.length === 1) candidates.push(parts[0])

  // Last resort: original (works for "Atlanta" alone)
  candidates.push(trimmed)

  const seen = new Set<string>()
  const out: string[] = []
  for (const c of candidates) {
    const key = c.toLowerCase()
    if (!c || seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}
