import { describe, expect, it } from 'vitest'
import {
  buildWeatherReadiness,
  isWeatherSensitiveJob,
  precipToStatus,
  selectWeatherSensitiveJobs,
  weatherCacheKey,
  weatherCodeToIcon,
  WEATHER_RISK_THRESHOLDS,
  type DayForecast,
  type WeatherJobInput,
} from './weather-risk'

function job(overrides: Partial<WeatherJobInput> = {}): WeatherJobInput {
  return {
    id: 'j1',
    date: '2026-07-04',
    start_time: '13:30',
    location_type: 'mobile',
    clientName: 'Devon Marsh',
    address: '1200 West Peachtree St NW, Atlanta, GA',
    status: 'scheduled',
    ...overrides,
  }
}

function forecast(overrides: Partial<DayForecast> = {}): DayForecast {
  return {
    date: '2026-07-04',
    precipChance: 10,
    tempMaxF: 89,
    weatherCode: 0,
    ...overrides,
  }
}

describe('isWeatherSensitiveJob (Option B)', () => {
  it('treats mobile as weather-sensitive', () => {
    expect(isWeatherSensitiveJob({ location_type: 'mobile' })).toBe(true)
  })

  it('treats fixed as not weather-sensitive', () => {
    expect(isWeatherSensitiveJob({ location_type: 'fixed' })).toBe(false)
  })
})

describe('precipToStatus', () => {
  it('maps thresholds', () => {
    expect(precipToStatus(0)).toBe('good_to_go')
    expect(precipToStatus(WEATHER_RISK_THRESHOLDS.goodMax)).toBe('good_to_go')
    expect(precipToStatus(WEATHER_RISK_THRESHOLDS.goodMax + 1)).toBe('rain_risk')
    expect(precipToStatus(WEATHER_RISK_THRESHOLDS.rainRiskMax)).toBe('rain_risk')
    expect(precipToStatus(WEATHER_RISK_THRESHOLDS.rainRiskMax + 1)).toBe('high_rain_risk')
    expect(precipToStatus(100)).toBe('high_rain_risk')
  })
})

describe('selectWeatherSensitiveJobs', () => {
  it('keeps mobile jobs in the next 3 days (any status)', () => {
    const selected = selectWeatherSensitiveJobs(
      [
        job({ id: 'a', date: '2026-07-04' }),
        job({ id: 'b', date: '2026-07-05', location_type: 'fixed' }),
        job({ id: 'c', date: '2026-07-06' }),
        job({ id: 'd', date: '2026-07-07' }),
        job({ id: 'e', date: '2026-07-04', status: 'completed' }),
      ],
      '2026-07-04',
    )
    expect(selected.map((j) => j.id)).toEqual(['a', 'e', 'c'])
  })
})

describe('fallbackWeatherPlace', () => {
  it('maps common US timezones to a city Open-Meteo can resolve', async () => {
    const { fallbackWeatherPlace } = await import('./weather-risk')
    expect(fallbackWeatherPlace('America/New_York')).toBe('Atlanta')
    expect(fallbackWeatherPlace('America/Chicago')).toBe('Chicago')
    expect(fallbackWeatherPlace('America/Los_Angeles')).toBe('Los Angeles')
  })
})

describe('buildWeatherReadiness', () => {
  it('returns null when no sensitive jobs have forecasts', () => {
    expect(buildWeatherReadiness([job({ location_type: 'fixed' })], new Map(), '2026-07-04')).toBeNull()
    expect(buildWeatherReadiness([job()], new Map(), '2026-07-04')).toBeNull()
  })

  it('uses one Good to go row per clear day with job count', () => {
    const jobs = [
      job({ id: 'a', date: '2026-07-04' }),
      job({ id: 'a2', date: '2026-07-04', clientName: 'Other' }),
      job({ id: 'a3', date: '2026-07-04', clientName: 'Third' }),
      job({ id: 'b', date: '2026-07-06', clientName: 'Owen Park' }),
    ]
    const forecasts = new Map([
      ['a', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['a2', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['a3', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['b', forecast({ date: '2026-07-06', precipChance: 20 })],
    ])
    const result = buildWeatherReadiness(jobs, forecasts, '2026-07-04')
    expect(result?.rows).toHaveLength(2)
    expect(result?.rows[0]).toMatchObject({
      kind: 'good',
      primary: 'Today · 89°, 10% rain',
      secondary: '3 jobs scheduled',
      statusLabel: 'Good to go',
    })
    expect(result?.rows[1].kind).toBe('good')
    if (result?.rows[1].kind === 'good') {
      expect(result.rows[1].secondary).toBe('1 job scheduled')
    }
  })

  it('matches mock: good day row then per-job risk rows; high risk leads', () => {
    const jobs = [
      job({ id: 't1', date: '2026-07-04', clientName: 'A' }),
      job({ id: 't2', date: '2026-07-04', clientName: 'B' }),
      job({ id: 't3', date: '2026-07-04', clientName: 'C' }),
      job({ id: 'mid', date: '2026-07-05', clientName: 'Devon Marsh', start_time: '13:30' }),
      job({ id: 'high', date: '2026-07-06', clientName: 'Owen Park', start_time: '10:00' }),
    ]
    const forecasts = new Map([
      ['t1', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['t2', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['t3', forecast({ date: '2026-07-04', precipChance: 10, tempMaxF: 89 })],
      ['mid', forecast({ date: '2026-07-05', precipChance: 35, tempMaxF: 91, weatherCode: 61 })],
      ['high', forecast({ date: '2026-07-06', precipChance: 70, tempMaxF: 88, weatherCode: 95 })],
    ])
    const result = buildWeatherReadiness(jobs, forecasts, '2026-07-04')
    expect(result?.rows.map((r) => (r.kind === 'risk' ? r.jobId : r.kind))).toEqual([
      'high',
      'good',
      'mid',
    ])
    const good = result?.rows[1]
    const mid = result?.rows[2]
    expect(good).toMatchObject({
      kind: 'good',
      primary: 'Today · 89°, 10% rain',
      secondary: '3 jobs scheduled',
      statusLabel: 'Good to go',
    })
    expect(mid).toMatchObject({
      kind: 'risk',
      primary: 'Sun · 91°, 35% rain',
      secondary: 'Devon Marsh · 1:30 PM outdoor detail',
      statusLabel: 'Rain risk',
    })
  })
})

describe('weatherCodeToIcon', () => {
  it('maps WMO codes', () => {
    expect(weatherCodeToIcon(0, 0)).toBe('sun')
    expect(weatherCodeToIcon(3, 0)).toBe('cloud')
    expect(weatherCodeToIcon(61, 40)).toBe('rain')
    expect(weatherCodeToIcon(95, 80)).toBe('storm')
    expect(weatherCodeToIcon(71, 20)).toBe('snow')
  })
})

describe('weatherCacheKey', () => {
  it('rounds coords to 2 decimals', () => {
    expect(weatherCacheKey('2026-07-04', 33.749, -84.388)).toBe('2026-07-04:33.75,-84.39')
  })
})

describe('geocodeQueryCandidates', () => {
  it('prefers city from a US street address', async () => {
    const { geocodeQueryCandidates } = await import('./weather-risk')
    expect(geocodeQueryCandidates('1420 Peachtree St NE, Atlanta, GA 30309')).toEqual([
      'Atlanta',
      'Atlanta GA',
      '1420 Peachtree St NE, Atlanta, GA 30309',
    ])
  })
})
