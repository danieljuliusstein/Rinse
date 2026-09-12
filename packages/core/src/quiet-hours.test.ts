import { describe, expect, it } from 'vitest'
import {
  DEFAULT_QUIET_END_HOUR,
  DEFAULT_QUIET_START_HOUR,
  getHourInTimeZone,
  isWithinQuietHours,
  nextQuietHoursEnd,
  normalizeTimeZone,
  zonedCivilToUtc,
} from './quiet-hours'

describe('normalizeTimeZone', () => {
  it('falls back for invalid ids', () => {
    expect(normalizeTimeZone('Not/AZone')).toBe('America/New_York')
    expect(normalizeTimeZone('America/Chicago')).toBe('America/Chicago')
  })
})

describe('isWithinQuietHours', () => {
  it('uses org timezone not server local', () => {
    // 2026-07-12 03:30 UTC = 11:30pm previous evening Eastern / 8:30pm Pacific
    const utc = new Date('2026-07-12T03:30:00.000Z')
    expect(isWithinQuietHours(utc, { timeZone: 'America/New_York' })).toBe(true)
    expect(isWithinQuietHours(utc, { timeZone: 'America/Los_Angeles' })).toBe(false)
  })

  it('respects enabled=false', () => {
    const utc = new Date('2026-07-12T03:30:00.000Z')
    expect(isWithinQuietHours(utc, { timeZone: 'America/New_York', enabled: false })).toBe(false)
  })

  it('flags overnight default window in Eastern', () => {
    // 2am Eastern
    const twoAmEt = zonedCivilToUtc(2026, 7, 12, 2, 0, 'America/New_York')
    expect(isWithinQuietHours(twoAmEt, { timeZone: 'America/New_York' })).toBe(true)

    const noonEt = zonedCivilToUtc(2026, 7, 12, 12, 0, 'America/New_York')
    expect(isWithinQuietHours(noonEt, { timeZone: 'America/New_York' })).toBe(false)

    const ninePmEt = zonedCivilToUtc(2026, 7, 12, 21, 0, 'America/New_York')
    expect(isWithinQuietHours(ninePmEt, { timeZone: 'America/New_York' })).toBe(true)

    const eightAmEt = zonedCivilToUtc(2026, 7, 12, 8, 0, 'America/New_York')
    expect(isWithinQuietHours(eightAmEt, { timeZone: 'America/New_York' })).toBe(false)
  })

  it('exposes default constants', () => {
    expect(DEFAULT_QUIET_START_HOUR).toBe(21)
    expect(DEFAULT_QUIET_END_HOUR).toBe(8)
  })
})

describe('getHourInTimeZone', () => {
  it('returns Eastern hour for a known UTC instant', () => {
    const utc = new Date('2026-01-15T17:00:00.000Z') // noon EST (UTC-5)
    expect(getHourInTimeZone(utc, 'America/New_York')).toBe(12)
  })
})

describe('nextQuietHoursEnd', () => {
  it('returns 8am same day when still in quiet window', () => {
    const threeAm = zonedCivilToUtc(2026, 7, 12, 3, 15, 'America/Chicago')
    const end = nextQuietHoursEnd(threeAm, { timeZone: 'America/Chicago' })
    expect(getHourInTimeZone(end, 'America/Chicago')).toBe(8)
    const endPartsDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      day: 'numeric',
    }).format(end)
    expect(endPartsDay).toBe('12')
  })

  it('rolls to next morning after quiet window ends', () => {
    const tenAm = zonedCivilToUtc(2026, 7, 12, 10, 0, 'America/Chicago')
    const end = nextQuietHoursEnd(tenAm, { timeZone: 'America/Chicago' })
    expect(getHourInTimeZone(end, 'America/Chicago')).toBe(8)
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      day: 'numeric',
    }).format(end)
    expect(day).toBe('13')
  })
})
