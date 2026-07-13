import { formatScheduledLabel } from '@rinse/core'
import type { JobWithRelations, Package, Supply } from '@rinse/core'
import { normalizeJobDate } from '@/src/lib/jobs-list'

export interface TodayJobCardData {
  id: string
  clientName: string
  packageName: string
  vehicleType: string
  locationLabel: string
  startTimeLabel: string | null
  address?: string
}

export interface ComingUpJobData {
  id: string
  clientName: string
  packageName: string
  vehicleType: string
  locationLabel: string
  datetimeLabel: string
  monthLabel: string
  dayLabel: string
  statusLabel: string
}

export interface InventoryAlertData {
  variant: 'warning' | 'danger'
  title: string
  subtitle: string
  supplyIds: string[]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function locationLabel(locationType: 'mobile' | 'fixed'): string {
  return locationType === 'mobile' ? 'Mobile detail' : 'Shop detail'
}

export function formatStartTimeLabel(startTime?: string, arrivalWindowEnd?: string): string | null {
  if (!startTime?.trim()) return null
  const startLabel = (() => {
    const [h, m] = startTime.split(':').map(Number)
    if (Number.isNaN(h)) return null
    const dt = new Date()
    dt.setHours(h, m ?? 0)
    return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  })()
  if (!startLabel) return null
  if (!arrivalWindowEnd?.trim()) return startLabel
  const [eh, em] = arrivalWindowEnd.split(':').map(Number)
  if (Number.isNaN(eh)) return startLabel
  const end = new Date()
  end.setHours(eh, em ?? 0)
  const endLabel = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${startLabel} – ${endLabel}`
}

export function jobsForDate(jobs: JobWithRelations[], date: string): JobWithRelations[] {
  return jobs
    .filter((j) => normalizeJobDate(j.date) === date)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
}

export function buildTodayJobCard(jobs: JobWithRelations[]): TodayJobCardData | null {
  const today = new Date().toISOString().split('T')[0]
  const todayJobs = jobsForDate(jobs, today)
  if (todayJobs.length === 0) return null

  const job = [...todayJobs].sort((a, b) => {
    const ta = a.start_time ?? '99:99'
    const tb = b.start_time ?? '99:99'
    if (ta !== tb) return ta.localeCompare(tb)
    return a.id.localeCompare(b.id)
  })[0]

  return {
    id: job.id,
    clientName: job.client?.name ?? 'Client',
    packageName: job.package?.name ?? 'Detail',
    vehicleType: capitalize(job.vehicle_type),
    locationLabel: locationLabel(job.location_type),
    startTimeLabel: formatStartTimeLabel(job.start_time, job.arrival_window_end),
    address: job.client?.address,
  }
}

export function buildMoreTodayJobs(jobs: JobWithRelations[]): TodayJobCardData[] {
  const today = new Date().toISOString().split('T')[0]
  const todayJobs = jobsForDate(jobs, today)
  const primary = buildTodayJobCard(jobs)
  const rest = primary ? todayJobs.filter((j) => j.id !== primary.id) : todayJobs
  return rest.map((job) => ({
    id: job.id,
    clientName: job.client?.name ?? 'Client',
    packageName: job.package?.name ?? 'Detail',
    vehicleType: capitalize(job.vehicle_type),
    locationLabel: locationLabel(job.location_type),
    startTimeLabel: formatStartTimeLabel(job.start_time, job.arrival_window_end),
    address: job.client?.address,
  }))
}

export function todayJobDetailsLine(job: TodayJobCardData): string {
  return `${job.packageName} · ${job.vehicleType} · ${job.locationLabel}`
}

export function isLowStock(supply: Supply): boolean {
  if (supply.reorder_threshold == null) return false
  return supply.quantity_on_hand <= supply.reorder_threshold
}

export function isOutOfStock(supply: Supply): boolean {
  return supply.quantity_on_hand <= 0
}

function mapComingUpJob(job: JobWithRelations): ComingUpJobData {
  const date = normalizeJobDate(job.date)
  const parsed = new Date(`${date}T12:00:00`)
  return {
    id: job.id,
    clientName: job.client?.name ?? 'Unknown',
    packageName: job.package?.name ?? '—',
    vehicleType: capitalize(job.vehicle_type),
    locationLabel: locationLabel(job.location_type),
    datetimeLabel: formatScheduledLabel(date, job.start_time),
    monthLabel: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    dayLabel: String(parsed.getDate()),
    statusLabel: job.start_time ? 'Confirmed' : 'Pending',
  }
}

export function buildComingUpJobs(jobs: JobWithRelations[], limit = 3): ComingUpJobData[] {
  const todayStr = new Date().toISOString().split('T')[0]
  return jobs
    .filter((j) => j.status === 'scheduled' && normalizeJobDate(j.date) > todayStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    })
    .slice(0, limit)
    .map(mapComingUpJob)
}

/** Home header search — match client, package, vehicle, notes, date, status. */
export function searchHomeJobs(jobs: JobWithRelations[], query: string, limit = 40): JobWithRelations[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return jobs
    .filter((job) => {
      const hay = [
        job.client?.name,
        job.client?.phone,
        job.client?.email,
        job.client?.address,
        job.package?.name,
        job.vehicle_type,
        job.location_type,
        job.status,
        job.notes,
        normalizeJobDate(job.date),
        job.start_time,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => {
      const da = normalizeJobDate(a.date)
      const db = normalizeJobDate(b.date)
      if (da !== db) return db.localeCompare(da)
      return (a.start_time ?? '').localeCompare(b.start_time ?? '')
    })
    .slice(0, limit)
}

export function buildInventoryAlert(
  packageId: string | undefined,
  supplies: Supply[],
  packages: Package[]
): InventoryAlertData | null {
  if (!packageId) return null
  const pkg = packages.find((p) => p.id === packageId)
  const defaultIds = pkg?.default_supplies?.map((d) => d.supply_id) ?? []
  if (defaultIds.length === 0) return null

  const flagged: { supply: Supply; out: boolean }[] = []
  for (const id of defaultIds) {
    const supply = supplies.find((s) => s.id === id)
    if (!supply) continue
    if (isOutOfStock(supply)) flagged.push({ supply, out: true })
    else if (isLowStock(supply)) flagged.push({ supply, out: false })
  }
  if (flagged.length === 0) return null

  const hasOut = flagged.some((f) => f.out)
  const names = flagged.map((f) => f.supply.name)
  return {
    variant: hasOut ? 'danger' : 'warning',
    title: hasOut
      ? `${flagged.filter((f) => f.out).length} item${flagged.filter((f) => f.out).length === 1 ? '' : 's'} out of stock for today`
      : `${flagged.length} item${flagged.length === 1 ? '' : 's'} running low for today`,
    subtitle: names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : ''),
    supplyIds: flagged.map((f) => f.supply.id),
  }
}

export function computeWeekDays(jobs: JobWithRelations[]) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const todayStr = now.toISOString().split('T')[0]
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      jobCount: jobs.filter((j) => j.date === dateStr).length,
    })
  }
  return days
}
