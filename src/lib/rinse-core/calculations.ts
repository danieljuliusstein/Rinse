import type { Job } from './types'

export function totalExpenses(
  job: Pick<Job, 'expenses' | 'travel_cost' | 'marketing_cost' | 'equipment_depreciation'>,
): number {
  const lineTotal = job.expenses.reduce((sum, e) => sum + e.amount, 0)
  return lineTotal + job.travel_cost + job.marketing_cost + job.equipment_depreciation
}

export function netProfit(
  job: Pick<
    Job,
    'revenue' | 'tip' | 'expenses' | 'travel_cost' | 'marketing_cost' | 'equipment_depreciation'
  >,
): number {
  return job.revenue + job.tip - totalExpenses(job)
}

export function isActiveJob(job: { status: string }): boolean {
  return job.status !== 'cancelled'
}

export function activeJobs<T extends { status: string }>(jobs: T[]): T[] {
  return jobs.filter(isActiveJob)
}
