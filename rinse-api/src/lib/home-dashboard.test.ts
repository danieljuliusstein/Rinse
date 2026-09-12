import { describe, expect, it } from 'vitest'
import {
  buildComingUpJob,
  buildInventoryAlert,
  buildTodayJobCard,
  formatStartTimeLabel,
  pickTipInsight,
} from './home-dashboard'
import type { JobWithRelations, Package, RecentJobRow, Supply } from './types'

function row(overrides: Partial<RecentJobRow> = {}): RecentJobRow {
  return {
    id: 'j1',
    clientName: 'Alex',
    package: 'Full Detail',
    packageId: 'pkg1',
    vehicleType: 'Suv',
    locationType: 'mobile',
    revenue: 200,
    profit: 100,
    status: 'scheduled',
    startTime: '09:00',
    jobStatus: 'scheduled',
    ...overrides,
  }
}

function job(overrides: Partial<JobWithRelations> = {}): JobWithRelations {
  return {
    id: 'j2',
    date: '2026-06-10',
    start_time: '10:00',
    hours_worked: 2,
    location_type: 'mobile',
    package_id: 'pkg1',
    vehicle_type: 'sedan',
    client_id: 'c1',
    status: 'scheduled',
    revenue: 150,
    tip: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
    client: { id: 'c1', name: 'Sam' },
    package: { id: 'pkg1', name: 'Wash', base_price: 50, expected_return_days: 30, active: true },
    ...overrides,
  } as JobWithRelations
}

describe('formatStartTimeLabel', () => {
  it('formats 24h time', () => {
    expect(formatStartTimeLabel('09:00')).toMatch(/9:00/)
  })

  it('returns null for empty', () => {
    expect(formatStartTimeLabel(undefined)).toBeNull()
  })
})

describe('buildTodayJobCard', () => {
  it('returns null when no jobs', () => {
    expect(buildTodayJobCard([])).toBeNull()
  })

  it('picks earliest start time', () => {
    const result = buildTodayJobCard([
      row({ id: 'b', startTime: '14:00' }),
      row({ id: 'a', startTime: '09:00' }),
    ])
    expect(result?.id).toBe('a')
    expect(result?.startTimeLabel).toBeTruthy()
  })
})

describe('buildComingUpJob', () => {
  it('returns earliest future scheduled job', () => {
    const today = new Date().toISOString().split('T')[0]
    const result = buildComingUpJob([
      job({ id: 'later', date: '2099-01-02' }),
      job({ id: 'sooner', date: '2099-01-01', start_time: '08:00' }),
      job({ id: 'today', date: today, status: 'scheduled' }),
    ])
    expect(result?.id).toBe('sooner')
  })
})

describe('buildInventoryAlert', () => {
  const todayJob = buildTodayJobCard([row()])!
  const packages: Package[] = [
    {
      id: 'pkg1',
      name: 'Full Detail',
      base_price: 200,
      expected_return_days: 30,
      duration_minutes: 120,
      active: true,
      default_supplies: [{ supply_id: 's1', default_qty: 1 }],
    },
  ]

  it('returns danger when supply is out', () => {
    const supplies: Supply[] = [
      { id: 's1', name: 'Soap', unit: 'oz', quantity_on_hand: 0, reorder_threshold: 2 },
    ]
    const alert = buildInventoryAlert(todayJob, supplies, packages)
    expect(alert?.variant).toBe('danger')
  })

  it('returns warning when supply is low', () => {
    const supplies: Supply[] = [
      { id: 's1', name: 'Soap', unit: 'oz', quantity_on_hand: 1, reorder_threshold: 2 },
    ]
    const alert = buildInventoryAlert(todayJob, supplies, packages)
    expect(alert?.variant).toBe('warning')
  })

  it('returns null when stock is healthy', () => {
    const supplies: Supply[] = [
      { id: 's1', name: 'Soap', unit: 'oz', quantity_on_hand: 10, reorder_threshold: 2 },
    ]
    expect(buildInventoryAlert(todayJob, supplies, packages)).toBeNull()
  })
})

describe('pickTipInsight', () => {
  it('prefers best-performing service insight', () => {
    const insights = ['Average job value: $100', 'Best-performing service: Full Detail']
    expect(pickTipInsight(insights)).toBe('Best-performing service: Full Detail')
  })
})
