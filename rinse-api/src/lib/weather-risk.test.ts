import { describe, expect, it } from 'vitest'
import {
  buildWeatherReadiness,
  isWeatherReadinessActiveJob,
  isWeatherSensitiveJob,
  precipToStatus,
  resolveWeatherJobAddress,
  selectWeatherSensitiveJobs,
  weatherCacheKey,
  weatherCodeToIcon,
  weatherReadinessPartialNote,
  WEATHER_RISK_THRESHOLDS,
  WEATHER_READINESS_EMPTY_MESSAGE,
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

describe('isWeatherReadinessActiveJob', () => {
  it('allows active calendar statuses and rejects paid', () => {
    expect(isWeatherReadinessActiveJob({ status: 'scheduled' })).toBe(true)
    expect(isWeatherReadinessActiveJob({ status: 'in_progress' })).toBe(true)
    expect(isWeatherReadinessActiveJob({ status: 'completed' })).toBe(true)
    expect(isWeatherReadinessActiveJob({ status: 'invoiced' })).toBe(true)
    expect(isWeatherReadinessActiveJob({ status: 'paid' })).toBe(false)
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
  it('keeps active mobile jobs in the next 3 days only', () => {
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

describe('resolveWeatherJobAddress', () => {
  it('prefers client address, then business, then unresolved', () => {
    expect(resolveWeatherJobAddress('123 Main', '456 Shop')).toEqual({
      address: '123 Main',
      addressSource: 'exact',
    })
    expect(resolveWeatherJobAddress('', '456 Shop')).toEqual({
      address: '456 Shop',
      addressSource: 'business_address',
    })
    expect(resolveWeatherJobAddress('', '')).toEqual({ addressSource: 'unresolved' })
  })
})

describe('buildWeatherReadiness', () => {
  it('returns no_jobs when nothing qualifies', () => {
    expect(buildWeatherReadiness([job({ location_type: 'fixed' })], new Map(), '2026-07-04')).toEqual({
      status: 'no_jobs',
      rows: [],
    })
    expect(buildWeatherReadiness([job({ status: 'paid' })], new Map(), '2026-07-04')).toEqual({
      status: 'no_jobs',
      rows: [],
    })
  })

  it('returns unresolved when qualifying jobs lack forecasts', () => {
    expect(buildWeatherReadiness([job()], new Map(), '2026-07-04')).toEqual({
      status: 'unresolved',
      rows: [],
      unresolvedCount: 1,
    })
  })

  it('returns partial when some jobs lack forecasts', () => {
    const jobs = [job({ id: 'a' }), job({ id: 'b', clientName: 'Other' })]
    const forecasts = new Map([['a', forecast()]])
    const result = buildWeatherReadiness(jobs, forecasts, '2026-07-04')
    expect(result.status).toBe('partial')
    expect(result.unresolvedCount).toBe(1)
    expect(result.rows).toHaveLength(1)
    expect(weatherReadinessPartialNote(1)).toBe("Couldn't check weather for 1 job")
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
    expect(result.status).toBe('ready')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      kind: 'good',
      primary: 'Today · 89°, 10% rain',
      secondary: '3 jobs scheduled',
      statusLabel: 'Good to go',
    })
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
    expect(result.status).toBe('ready')
    expect(result.rows.map((r) => (r.kind === 'risk' ? r.jobId : r.kind))).toEqual([
      'high',
      'good',
      'mid',
    ])
  })

  it('exposes empty-week copy constant', () => {
    expect(WEATHER_READINESS_EMPTY_MESSAGE).toBe('No outdoor jobs in the next 3 days.')
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
      'Atlanta, GA',
      '1420 Peachtree St NE, Atlanta, GA 30309',
    ])
  })
})
