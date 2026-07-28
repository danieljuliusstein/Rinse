import { mapJobStatusForDisplay } from '@rinse/core'
import type { JobWithRelations, Vehicle } from '@rinse/core'
import { normalizeJobDate } from '@/src/lib/jobs-list'

export type JobsListFilter = 'all' | 'scheduled' | 'in_progress' | 'recurring'

export interface JobListSection {
  key: 'today' | 'week' | 'month' | 'older' | string
  /** Localized date fragment for the today section (e.g. JUL 12). */
  dateHint?: string
  jobs: JobWithRelations[]
}

export type JobSearchVehicleIndex = Map<string, Vehicle[]>

function isRecurringJob(cadence?: string | null): boolean {
  return cadence === 'weekly' || cadence === 'biweekly' || cadence === 'monthly'
}

export function filterJobsByDate(jobs: JobWithRelations[], date: string): JobWithRelations[] {
  return sortJobsByRouteOrder(jobs.filter((job) => normalizeJobDate(job.date) === date))
}

/** Route order ASC (nulls last), then start_time ASC. */
export function sortJobsByRouteOrder(jobs: JobWithRelations[]): JobWithRelations[] {
  return [...jobs].sort((a, b) => {
    const ao = a.route_order
    const bo = b.route_order
    const aHas = ao != null && Number.isFinite(ao)
    const bHas = bo != null && Number.isFinite(bo)
    if (aHas && bHas && ao !== bo) return (ao as number) - (bo as number)
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    return (a.start_time ?? '').localeCompare(b.start_time ?? '')
  })
}

function vehicleSearchText(vehicle: Vehicle): string {
  return [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.color,
    vehicle.plate,
    vehicle.vin,
    vehicle.type,
  ]
    .filter((v) => v != null && String(v).trim().length > 0)
    .join(' ')
}

/**
 * Searchable job identifiers:
 * - Client: name, phone, email, address
 * - Service: package, location (mobile/shop), status, date, time, notes, expenses
 * - Job vehicle type: sedan/suv/truck/…
 * - Client vehicles: make, model, year, color, plate, VIN (joined by client)
 * - Invoice number when present
 * - Recurrence cadence
 */
export function jobSearchHaystack(
  job: JobWithRelations,
  clientVehicles: Vehicle[] = [],
): string {
  const statusDisplay = mapJobStatusForDisplay(job)
  const parts = [
    job.client?.name,
    job.client?.phone,
    job.client?.email,
    job.client?.address,
    job.client?.notes,
    job.package?.name,
    job.vehicle_type,
    job.location_type,
    job.location_type === 'fixed' ? 'shop fixed' : 'mobile',
    job.status,
    statusDisplay,
    jobListStatusLabel(job),
    job.notes,
    job.date,
    job.start_time,
    job.invoice?.invoice_number,
    job.invoice_id,
    job.recurrence_cadence,
    isRecurringJob(job.recurrence_cadence) ? 'recurring' : '',
    String(job.revenue ?? ''),
    String(job.tip ?? ''),
    ...(job.expenses ?? []).map((line) => `${line.description ?? ''} ${line.category ?? ''}`),
    ...clientVehicles.map(vehicleSearchText),
  ]

  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function queryTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,+/|]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

export function filterJobsList(
  jobs: JobWithRelations[],
  query: string,
  chip: JobsListFilter,
  vehiclesByClient?: JobSearchVehicleIndex,
): JobWithRelations[] {
  const tokens = queryTokens(query)
  return jobs.filter((job) => {
    if (tokens.length) {
      const hay = jobSearchHaystack(job, vehiclesByClient?.get(job.client_id) ?? [])
      if (!tokens.every((token) => hay.includes(token))) return false
    }
    if (chip === 'scheduled') return job.status === 'scheduled'
    if (chip === 'in_progress') return job.status === 'in_progress'
    if (chip === 'recurring') return isRecurringJob(job.recurrence_cadence)
    return true
  })
}

/** Best vehicle match for a search query (for list subtitle hints). */
export function matchingVehicleForQuery(
  vehicles: Vehicle[],
  query: string,
): Vehicle | null {
  const tokens = queryTokens(query)
  if (!tokens.length || vehicles.length === 0) return null
  for (const vehicle of vehicles) {
    const hay = vehicleSearchText(vehicle).toLowerCase()
    if (tokens.every((token) => hay.includes(token))) return vehicle
  }
  // Partial: any token hits vehicle-specific fields (make/color/plate)
  for (const vehicle of vehicles) {
    const hay = vehicleSearchText(vehicle).toLowerCase()
    if (tokens.some((token) => hay.includes(token) && token.length >= 3)) return vehicle
  }
  return null
}

export function groupJobsByPeriod(jobs: JobWithRelations[]): JobListSection[] {
  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const sorted = [...jobs].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    const ao = a.route_order
    const bo = b.route_order
    const aHas = ao != null && Number.isFinite(ao)
    const bHas = bo != null && Number.isFinite(bo)
    if (a.date === today) {
      if (aHas && bHas && ao !== bo) return (ao as number) - (bo as number)
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      return (a.start_time ?? '').localeCompare(b.start_time ?? '')
    }
    return (b.start_time ?? '').localeCompare(a.start_time ?? '')
  })

  const todayJobs: JobWithRelations[] = []
  const weekJobs: JobWithRelations[] = []
  const monthJobs: JobWithRelations[] = []

  for (const job of sorted) {
    const d = new Date(job.date + 'T12:00:00')
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (job.date === today) todayJobs.push(job)
    else if (d >= weekStart && d <= weekEnd) weekJobs.push(job)
    else if (d >= monthStart && d < weekStart) monthJobs.push(job)
  }

  const sections: JobListSection[] = []
  const todayLabel = new Date(today + 'T12:00:00')
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    .toUpperCase()
  if (todayJobs.length) sections.push({ key: 'today', dateHint: todayLabel, jobs: todayJobs })
  if (weekJobs.length) sections.push({ key: 'week', jobs: weekJobs })
  if (monthJobs.length) sections.push({ key: 'month', jobs: monthJobs })

  const groupedIds = new Set([...todayJobs, ...weekJobs, ...monthJobs].map((j) => j.id))
  const olderJobs = sorted.filter((j) => !groupedIds.has(j.id))
  if (olderJobs.length) sections.push({ key: 'older', jobs: olderJobs })

  return sections
}

export function jobListStatusLabel(job: JobWithRelations): string {
  if (job.status === 'in_progress') return 'In progress'
  const display = mapJobStatusForDisplay(job)
  if (display === 'scheduled') return 'Scheduled'
  if (display === 'paid') return 'Paid'
  if (display === 'invoiced') return 'Invoiced'
  if (display === 'overdue') return 'Awaiting payment'
  return 'Complete'
}

export const JOB_FILTER_CHIPS: { key: JobsListFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'jobs.filters.all' },
  { key: 'scheduled', labelKey: 'jobs.filters.scheduled' },
  { key: 'in_progress', labelKey: 'jobs.filters.inProgress' },
  { key: 'recurring', labelKey: 'jobs.filters.recurring' },
]
