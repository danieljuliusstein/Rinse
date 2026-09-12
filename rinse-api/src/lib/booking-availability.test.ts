import { describe, expect, it } from 'vitest'
import {
  computeAvailability,
  DEFAULT_BOOKING_SCHEDULE,
  intervalsOverlap,
  normalizeBookingSchedule,
  weekdayFromIsoDate,
} from './booking-availability'

const schedule = { ...DEFAULT_BOOKING_SCHEDULE }

describe('intervalsOverlap', () => {
  it('detects overlap', () => {
    expect(intervalsOverlap(600, 720, 660, 780)).toBe(true)
  })

  it('allows adjacent intervals', () => {
    expect(intervalsOverlap(600, 720, 720, 840)).toBe(false)
  })
})

describe('computeAvailability', () => {
  it('closes on Sunday when not in work_days', () => {
    const sunday = '2026-06-28'
    expect(weekdayFromIsoDate(sunday)).toBe(0)
    const slots = computeAvailability({
      schedule,
      date: sunday,
      packageDurationMinutes: 120,
      jobs: [],
      blocks: [],
    })
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => !s.available)).toBe(true)
  })

  it('blocks lunch hour starts', () => {
    const slots = computeAvailability({
      schedule,
      date: '2026-06-27',
      packageDurationMinutes: 120,
      jobs: [],
      blocks: [],
    })
    const noon = slots.find((s) => s.time === '12:00')
    expect(noon?.available).toBe(false)
  })

  it('coerces string work days from PocketBase JSON', () => {
    const schedule = normalizeBookingSchedule({
      work_days: ['1', '2', '3', '4', '5'],
      start_time: '08:00',
      end_time: '18:00',
      slot_interval_minutes: 120,
    })
    expect(schedule.work_days).toEqual([1, 2, 3, 4, 5])
  })

  it('parses JSON string booking schedule from PocketBase', () => {
    const schedule = normalizeBookingSchedule(
      JSON.stringify({
        work_days: [0, 2, 4],
        start_time: '09:00',
        end_time: '17:00',
        slot_interval_minutes: 90,
      }),
    )
    expect(schedule.work_days).toEqual([0, 2, 4])
    expect(schedule.start_time).toBe('09:00')
    expect(schedule.slot_interval_minutes).toBe(90)
  })

  it('blocks overlapping slots when a 4h job starts at 10:00', () => {
    const slots = computeAvailability({
      schedule,
      date: '2026-06-27',
      packageDurationMinutes: 240,
      jobs: [{ start_time: '10:00', status: 'scheduled', duration_minutes: 240 }],
      blocks: [],
    })
    expect(slots.find((s) => s.time === '10:00')?.available).toBe(false)
    expect(slots.find((s) => s.time === '12:00')?.available).toBe(false)
    expect(slots.find((s) => s.time === '08:00')?.available).toBe(false)
    expect(slots.find((s) => s.time === '14:00')?.available).toBe(true)
  })

  it('blocks partial time-off', () => {
    const slots = computeAvailability({
      schedule,
      date: '2026-06-27',
      packageDurationMinutes: 120,
      jobs: [],
      blocks: [{ date: '2026-06-27', start_time: '14:00', end_time: '16:00', all_day: false }],
    })
    expect(slots.find((s) => s.time === '14:00')?.available).toBe(false)
    expect(slots.find((s) => s.time === '08:00')?.available).toBe(true)
  })

  it('blocks all slots on all-day time off', () => {
    const slots = computeAvailability({
      schedule,
      date: '2026-06-27',
      packageDurationMinutes: 120,
      jobs: [],
      blocks: [{ date: '2026-06-27', all_day: true }],
    })
    expect(slots.every((s) => !s.available)).toBe(true)
  })
})
