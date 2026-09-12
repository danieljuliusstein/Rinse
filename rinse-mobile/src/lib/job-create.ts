import type { JobStatus } from '@rinse/core'

/** Local calendar date as YYYY-MM-DD. */
export function localCalendarDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Quick Add: log finished work for today/past; book upcoming work as scheduled. */
export function defaultQuickJobStatus(jobDate: string): JobStatus {
  return jobDate > localCalendarDate() ? 'scheduled' : 'completed'
}

/** PocketBase jobs.create body — matches PWA appJobCreateToPb (no photo_count). */
export function jobPbCreateFields(input: {
  date: string
  locationType: string
  packageId: string
  vehicleType: string
  clientId: string
  revenue: number
  tip: number
  start_time?: string
  notes?: string
  travel_cost?: number
  marketing_cost?: number
  equipment_depreciation?: number
  recurrence_cadence?: string
  recurrence_anchor_date?: string
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    date: input.date,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: input.clientId,
    status: defaultQuickJobStatus(input.date),
    revenue: input.revenue,
    tip: input.tip,
    start_time: input.start_time ?? '',
    notes: input.notes ?? '',
    hours_worked: 0,
    travel_cost: input.travel_cost ?? 0,
    marketing_cost: input.marketing_cost ?? 0,
    equipment_depreciation: input.equipment_depreciation ?? 0,
    expenses: [],
    supplies_used: [],
  }
  if (input.recurrence_cadence) {
    payload.recurrence_cadence = input.recurrence_cadence
    payload.recurrence_anchor_date = input.recurrence_anchor_date ?? input.date
  }
  return payload
}
