import { describe, expect, it } from 'vitest'
import { buildLeadSourceReport } from './lead-source-report'
import type { Client, Job } from './types'

const clients: Client[] = [
  { id: 'c1', name: 'Alice', lead_source: 'google', created: '2026-01-01' },
  { id: 'c2', name: 'Bob', created: '2026-01-01' },
]

const jobs: Job[] = [
  {
    id: 'j1', client_id: 'c1', package_id: 'p1', date: '2026-06-01', vehicle_type: 'sedan',
    location_type: 'mobile', status: 'paid', revenue: 100, tip: 10, hours_worked: 2,
    expenses: [], supplies_used: [], travel_cost: 0, marketing_cost: 0, equipment_depreciation: 0,
    photo_count: 0, created: '2026-06-01', updated: '2026-06-01',
  },
  {
    id: 'j2', client_id: 'c2', package_id: 'p1', date: '2026-06-02', vehicle_type: 'suv',
    location_type: 'mobile', status: 'paid', revenue: 200, tip: 0, hours_worked: 3,
    expenses: [], supplies_used: [], travel_cost: 0, marketing_cost: 0, equipment_depreciation: 0,
    photo_count: 0, created: '2026-06-02', updated: '2026-06-02',
  },
]

describe('buildLeadSourceReport', () => {
  it('aggregates revenue and buckets unknown lead sources', () => {
    const rows = buildLeadSourceReport(clients, jobs, 'this_month', new Date('2026-06-05T12:00:00'))
    const google = rows.find((r) => r.source === 'Google')
    const unknown = rows.find((r) => r.source === 'Unknown')
    expect(google?.revenue).toBe(110)
    expect(google?.jobCount).toBe(1)
    expect(unknown?.revenue).toBe(200)
    expect(unknown?.clientCount).toBe(1)
  })
})
