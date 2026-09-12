import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeMilestoneState } from './compute'
import type { JobWithRelations } from '../types'
import {
  getMilestonesLastViewedAt,
  hasUnviewedMilestones,
  markMilestonesViewed,
} from './viewed'

function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function job(date: string): JobWithRelations {
  return {
    id: `j-${date}`,
    date,
    hours_worked: 1,
    location_type: 'mobile',
    package_id: 'pkg1',
    vehicle_type: 'sedan',
    client_id: 'c1',
    status: 'completed',
    revenue: 100,
    tip: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
  } as JobWithRelations
}

describe('milestones viewed storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('marks unviewed when unlocked milestones exist and nothing viewed', () => {
    const { milestones } = computeMilestoneState([job('2026-03-12')])
    expect(hasUnviewedMilestones(milestones)).toBe(true)
  })

  it('clears unviewed after markViewed', () => {
    const { milestones } = computeMilestoneState([job('2026-03-12')])
    markMilestonesViewed(new Date('2026-06-25T12:00:00.000Z'))
    expect(getMilestonesLastViewedAt()).toBe('2026-06-25T12:00:00.000Z')
    expect(hasUnviewedMilestones(milestones)).toBe(false)
  })

  it('shows unviewed when a newer milestone unlocks after last viewed', () => {
    markMilestonesViewed(new Date('2026-03-01T12:00:00.000Z'))
    const { milestones } = computeMilestoneState([
      job('2026-03-12'),
      ...Array.from({ length: 9 }, (_, i) => job(`2026-04-${String(i + 1).padStart(2, '0')}`)),
    ])
    expect(hasUnviewedMilestones(milestones)).toBe(true)
  })
})
