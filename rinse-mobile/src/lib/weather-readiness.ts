export type WeatherRiskStatus = 'good_to_go' | 'rain_risk' | 'high_rain_risk'

export type WeatherIconKind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow'

export type WeatherReadinessRow = {
  kind: 'good' | 'risk'
  date?: string
  jobId?: string
  primary: string
  secondary: string
  status?: WeatherRiskStatus | string
  statusLabel?: string
  icon?: WeatherIconKind
  precipChance?: number
  tempMaxF?: number
  jobCount?: number
}

export type WeatherReadinessResult = {
  status: 'no_jobs' | 'unresolved' | 'partial' | 'ready'
  rows: WeatherReadinessRow[]
  unresolvedCount?: number
  reason?: 'no_address' | 'geocode_failed' | 'offline'
}

export const WEATHER_READINESS_EMPTY_MESSAGE = 'No outdoor jobs in the next 3 days.'
export const WEATHER_READINESS_UNRESOLVED_MESSAGE = "Couldn't check the forecast right now"
export const WEATHER_READINESS_NO_ADDRESS_MESSAGE =
  'Add a client or business address to check outdoor weather'
export const WEATHER_READINESS_OFFLINE_MESSAGE = 'Weather unavailable — pull to refresh'

export function weatherReadinessPartialNote(count: number): string {
  return count === 1
    ? "Couldn't check weather for 1 job"
    : `Couldn't check weather for ${count} jobs`
}

export function hasWeatherRisk(readiness: WeatherReadinessResult | null | undefined): boolean {
  return Boolean(readiness?.rows.some((row) => row.kind === 'risk'))
}

export type ReadinessSeverity = 'high' | 'watch' | 'clear' | 'empty' | 'unresolved'

/** Map API row status / precip into the Home card severity tiers. */
export function readinessSeverityForRow(row: WeatherReadinessRow): Exclude<ReadinessSeverity, 'empty' | 'unresolved'> {
  if (row.status === 'high_rain_risk') return 'high'
  if (row.status === 'rain_risk') return 'watch'
  if (row.status === 'good_to_go') return 'clear'
  if (typeof row.precipChance === 'number') {
    if (row.precipChance > 60) return 'high'
    if (row.precipChance > 30) return 'watch'
  }
  return row.kind === 'risk' ? 'watch' : 'clear'
}

export function weatherReadinessCompactSummary(
  result: WeatherReadinessResult | null | undefined,
): { hasRisk: boolean; headline: string; tone: 'clear' | 'risk' | 'empty' | 'unresolved' } | null {
  if (!result) return null
  if (result.status === 'no_jobs') {
    return { hasRisk: false, headline: WEATHER_READINESS_EMPTY_MESSAGE, tone: 'empty' }
  }
  if (result.status === 'unresolved') {
    const headline =
      result.reason === 'no_address'
        ? WEATHER_READINESS_NO_ADDRESS_MESSAGE
        : result.reason === 'offline'
          ? WEATHER_READINESS_OFFLINE_MESSAGE
          : WEATHER_READINESS_UNRESOLVED_MESSAGE
    return { hasRisk: false, headline, tone: 'unresolved' }
  }
  if (hasWeatherRisk(result)) {
    return { hasRisk: true, headline: 'Weather may affect jobs', tone: 'risk' }
  }
  return { hasRisk: false, headline: 'Outdoor jobs look clear', tone: 'clear' }
}

function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const UNRESOLVED: WeatherReadinessResult = { status: 'unresolved', rows: [], reason: 'geocode_failed' }
const NO_JOBS: WeatherReadinessResult = { status: 'no_jobs', rows: [] }
const OFFLINE: WeatherReadinessResult = { status: 'unresolved', rows: [], reason: 'offline' }

function apiErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  if (!('status' in err)) return undefined
  const status = (err as { status: unknown }).status
  return typeof status === 'number' ? status : undefined
}

function isNetworkFailure(err: unknown): boolean {
  if (!err) return false
  if (err instanceof TypeError) return true
  const message = err instanceof Error ? err.message : String(err)
  return /network|fetch|failed to connect|econnrefused|timed out/i.test(message)
}

export async function fetchWeatherReadiness(): Promise<WeatherReadinessResult> {
  const today = localIsoDate()
  // Dynamic import keeps this module RN-free for native-smoke and unit tests.
  const { appApiJson } = await import('./app-api')
  try {
    const data = await appApiJson<{ readiness?: WeatherReadinessResult }>('/api/weather/readiness', {
      method: 'POST',
      body: JSON.stringify({ today }),
    })
    return data.readiness ?? UNRESOLVED
  } catch (err) {
    // Unauthorized / missing API config — hide banner instead of a red error chip.
    const status = apiErrorStatus(err)
    if (status === 0 || status === 401 || status === 403 || status === 404) {
      if (status === 404) {
        console.warn('[weather-readiness] API route not found — is detailing-app dev server running on :3000?')
      } else {
        console.warn('[weather-readiness]', err instanceof Error ? err.message : err)
      }
      return NO_JOBS
    }
    if (isNetworkFailure(err) || status === 502 || status === 503 || status === 504) {
      console.warn('[weather-readiness] API unreachable', err instanceof Error ? err.message : err)
      return OFFLINE
    }
    console.warn('[weather-readiness] fetch failed', err)
    return UNRESOLVED
  }
}
