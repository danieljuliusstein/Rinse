import { describe, expect, it } from 'vitest'
import { aggregateJobsRevenue, donutArcPath } from './jobs-revenue'
import type { JobWithRelations } from './types'

describe('donutArcPath', () => {
  it('renders a full ring when sweep is 360°', () => {
    const start = -Math.PI / 2
    const end = start + Math.PI * 2
    const path = donutArcPath(90, 90, 78, 50, start, end)
    expect(path).toContain('A 78 78')
    expect(path).toContain('A 50 50')
    expect(path.split('A 78 78').length).toBeGreaterThan(2)
  })

  it('renders a partial arc for fractional slices', () => {
    const start = 0
    const end = Math.PI / 2
    const path = donutArcPath(90, 90, 78, 50, start, end)
    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
  })
})

describe('aggregateJobsRevenue', () => {
  it('groups all revenue into one service slice', () => {
    const jobs = [
      { revenue: 10000, tip: 0, package: { name: 's' }, expenses: [], travel_cost: 0, marketing_cost: 0, equipment_depreciation: 0 },
      { revenue: 10000, tip: 0, package: { name: 's' }, expenses: [], travel_cost: 0, marketing_cost: 0, equipment_depreciation: 0 },
    ] as JobWithRelations[]

    const stats = aggregateJobsRevenue(jobs)
    expect(stats.services).toHaveLength(1)
    expect(stats.services[0].amount).toBe(20000)
  })
})
