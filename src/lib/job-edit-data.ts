import type { Job, JobEditData, JobWithRelations } from './types'

export function buildJobEditData(
  job: Job | JobWithRelations,
  overrides: Partial<JobEditData> = {}
): JobEditData {
  return {
    date: job.date,
    packageId: job.package_id,
    vehicleType: job.vehicle_type,
    locationType: job.location_type,
    revenue: job.revenue,
    tip: job.tip,
    hours_worked: job.hours_worked ?? 0,
    start_time: job.start_time,
    status: job.status,
    notes: job.notes,
    supplies_used: job.supplies_used,
    travel_cost: job.travel_cost,
    marketing_cost: job.marketing_cost,
    equipment_depreciation: job.equipment_depreciation,
    recurrence_cadence: job.recurrence_cadence,
    recurrence_anchor_date: job.recurrence_anchor_date,
    ...overrides,
  }
}
