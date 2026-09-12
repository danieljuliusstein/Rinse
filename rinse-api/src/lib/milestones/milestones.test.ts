import { describe, expect, it } from 'vitest'
import { computeMilestoneState, formatLifetimeEarned, weekStartKey } from './compute'
import type { JobWithRelations, LeadWithRelations } from '../types'

function job(overrides: Partial<JobWithRelations> = {}): JobWithRelations {
  return {
    id: 'j1',
    date: '2026-03-12',
    hours_worked: 2,
    location_type: 'mobile',
    package_id: 'pkg1',
    vehicle_type: 'sedan',
    client_id: 'c1',
    status: 'completed',
    revenue: 200,
    tip: 20,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    photo_count: 0,
    ...overrides,
  } as JobWithRelations
}

describe('weekStartKey', () => {
  it('returns Monday for mid-week date', () => {
    expect(weekStartKey('2026-03-12')).toBe('2026-03-09')
  })
})

describe('computeMilestoneState', () => {
  it('unlocks first finish with one completed job', () => {
    const state = computeMilestoneState([job()])
    expect(state.milestones.find((m) => m.id === 'first_job')?.status).toBe('unlocked')
    expect(state.totalJobs).toBe(1)
    expect(state.totalEarned).toBe(220)
  })

  it('shows progress toward 50 jobs', () => {
    const jobs = Array.from({ length: 34 }, (_, i) =>
      job({ id: `j${i}`, date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}` })
    )
    const established = computeMilestoneState(jobs).milestones.find((m) => m.id === 'jobs_50')
    expect(established?.status).toBe('locked')
    expect(established?.progress).toBe('34 of 50 jobs')
  })

  it('unlocks strong week at $1,000+', () => {
    const jobs = [
      job({ id: 'a', date: '2026-06-02', revenue: 600, tip: 0 }),
      job({ id: 'b', date: '2026-06-03', revenue: 500, tip: 0 }),
    ]
    const strong = computeMilestoneState(jobs).milestones.find((m) => m.id === 'rev_week')
    expect(strong?.status).toBe('unlocked')
  })

  it('detects booking-link job from web booking notes', () => {
    const jobs = [job({ notes: 'Web booking: customer request' })]
    const booked = computeMilestoneState(jobs, []).milestones.find((m) => m.id === 'first_book')
    expect(booked?.status).toBe('unlocked')
  })

  it('detects booking-link from website lead', () => {
    const jobs = [job({ id: 'job-web', client_id: 'c-web' })]
    const leads: LeadWithRelations[] = [
      {
        id: 'l1',
        name: 'Web Lead',
        source: 'website',
        vehicle_type: 'sedan',
        stage: 'booked',
        job_id: 'job-web',
      },
    ]
    const booked = computeMilestoneState(jobs, leads).milestones.find((m) => m.id === 'first_book')
    expect(booked?.status).toBe('unlocked')
  })
})

describe('formatLifetimeEarned', () => {
  it('formats thousands compactly', () => {
    expect(formatLifetimeEarned(12480)).toBe('$12.5k')
  })

  it('formats small amounts as currency', () => {
    expect(formatLifetimeEarned(840)).toBe('$840')
  })
})
