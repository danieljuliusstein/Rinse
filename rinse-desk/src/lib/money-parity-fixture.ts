/**
 * Shared money-parity fixture (Desk-local copy of Detailing apps/api __parity__ fixture).
 * Exercises cancelled-job exclusion + lifetime activity clamping.
 */
import type { Job } from '@/lib/rinse-core'

function makeJob(
  overrides: Partial<Job> & Pick<Job, 'id' | 'date' | 'status' | 'revenue' | 'tip'>,
): Job {
  return {
    hours_worked: overrides.hours_worked ?? 2,
    location_type: overrides.location_type ?? 'mobile',
    package_id: overrides.package_id ?? 'pkg_std',
    vehicle_type: overrides.vehicle_type ?? 'sedan',
    client_id: overrides.client_id ?? 'client_1',
    expenses: overrides.expenses ?? [],
    supplies_used: overrides.supplies_used ?? [],
    travel_cost: overrides.travel_cost ?? 0,
    marketing_cost: overrides.marketing_cost ?? 0,
    equipment_depreciation: overrides.equipment_depreciation ?? 0,
    photo_count: overrides.photo_count ?? 0,
    ...overrides,
  }
}

export const FIXTURE_JOBS: Job[] = [
  makeJob({
    id: 'job_paid_2022',
    date: '2022-03-10',
    status: 'paid',
    revenue: 400,
    tip: 40,
    expenses: [{ category: 'supplies', description: 'wax', amount: 30 }],
    travel_cost: 10,
  }),
  makeJob({
    id: 'job_paid_2023',
    date: '2023-07-15',
    status: 'paid',
    revenue: 550,
    tip: 60,
    expenses: [{ category: 'supplies', description: 'foam', amount: 25 }],
    marketing_cost: 15,
  }),
  makeJob({
    id: 'job_completed_2024',
    date: '2024-01-20',
    status: 'completed',
    revenue: 300,
    tip: 20,
    expenses: [{ category: 'labor', description: 'helper', amount: 50 }],
    equipment_depreciation: 5,
  }),
  makeJob({
    id: 'job_cancelled_2024',
    date: '2024-02-05',
    status: 'cancelled',
    revenue: 999,
    tip: 111,
    expenses: [{ category: 'supplies', description: 'ghost', amount: 40 }],
  }),
]

export const CANCELLED_JOB_REVENUE = 999 + 111

export const FIXTURE_OVERHEAD = 200

export const FIXTURE_BUSINESS_EXPENSES = 150

export const FIXTURE_BUSINESS_EXPENSE_ROWS = [
  { id: 'be_1', date: '2022-03-01', name: 'LLC filing', amount: 150 },
]
