import { formatScheduledLabel } from './calculations'
import { isLowStock, isOutOfStock } from './supplies-logic'
import type { JobWithRelations, Package, RecentJobRow, Supply, WeekDay } from './types'

export interface TodayJobCardData {
  id: string
  clientName: string
  packageName: string
  packageId: string
  vehicleType: string
  locationLabel: string
  startTimeLabel: string | null
  address?: string
  jobStatus: JobWithRelations['status']
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

export interface HomeWeekStats {
  jobsThisWeek: number
  jobsRemaining: number
  earnedThisWeek: number
  earnedDeltaPct: number | null
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

export function formatStartTimeLabel(startTime?: string): string | null {
  if (!startTime?.trim()) return null
  const [h, m] = startTime.split(':').map(Number)
  if (Number.isNaN(h)) return null
  const dt = new Date()
  dt.setHours(h, m ?? 0)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function buildTodayJobCard(jobsToday: RecentJobRow[]): TodayJobCardData | null {
  if (jobsToday.length === 0) return null

  const sorted = [...jobsToday].sort((a, b) => {
    const ta = a.startTime ?? '99:99'
    const tb = b.startTime ?? '99:99'
    if (ta !== tb) return ta.localeCompare(tb)
    return a.id.localeCompare(b.id)
  })

  const job = sorted[0]

  return {
    id: job.id,
    clientName: job.clientName,
    packageName: job.package,
    packageId: job.packageId ?? '',
    vehicleType: job.vehicleType,
    locationLabel: locationLabel(job.locationType),
    startTimeLabel: formatStartTimeLabel(job.startTime),
    address: job.clientAddress,
    jobStatus: job.jobStatus ?? 'scheduled',
  }
}

function mapComingUpJob(job: JobWithRelations): ComingUpJobData {
  const date = new Date(job.date + 'T12:00:00')
  return {
    id: job.id,
    clientName: job.client?.name ?? 'Unknown',
    packageName: job.package?.name ?? '—',
    vehicleType: capitalize(job.vehicle_type),
    locationLabel: locationLabel(job.location_type),
    datetimeLabel: formatScheduledLabel(job.date, job.start_time),
    monthLabel: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    dayLabel: String(date.getDate()),
    statusLabel: job.start_time ? 'Confirmed' : 'Pending',
  }
}

export function buildComingUpJobs(jobs: JobWithRelations[], limit = 3): ComingUpJobData[] {
  const todayStr = new Date().toISOString().split('T')[0]

  return jobs
    .filter((j) => j.status === 'scheduled' && j.date > todayStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      const ta = a.start_time ?? '99:99'
      const tb = b.start_time ?? '99:99'
      return ta.localeCompare(tb)
    })
    .slice(0, limit)
    .map(mapComingUpJob)
}

export function buildComingUpJob(jobs: JobWithRelations[]): ComingUpJobData | null {
  return buildComingUpJobs(jobs, 1)[0] ?? null
}

export function buildHomeWeekStats(jobs: JobWithRelations[], weekDays: WeekDay[]): HomeWeekStats {
  const todayStr = new Date().toISOString().split('T')[0]
  const weekDates = new Set(weekDays.map((d) => d.date))
  const weekJobs = jobs.filter((j) => weekDates.has(j.date))
  const jobsThisWeek = weekJobs.length
  const jobsRemaining = weekJobs.filter((j) => j.status === 'scheduled' && j.date >= todayStr).length
  const earnedThisWeek = weekJobs.reduce((s, j) => s + j.revenue + j.tip, 0)

  const weekStart = weekDays[0]?.date
    ? new Date(weekDays[0].date + 'T12:00:00')
    : new Date()
  const priorStart = new Date(weekStart)
  priorStart.setDate(priorStart.getDate() - 7)
  const priorEnd = new Date(weekStart)
  priorEnd.setDate(priorEnd.getDate() - 1)

  const priorEarned = jobs
    .filter((j) => {
      const d = new Date(j.date + 'T12:00:00')
      return d >= priorStart && d <= priorEnd
    })
    .reduce((s, j) => s + j.revenue + j.tip, 0)

  const earnedDeltaPct =
    priorEarned > 0 ? Math.round(((earnedThisWeek - priorEarned) / priorEarned) * 100) : null

  return { jobsThisWeek, jobsRemaining, earnedThisWeek, earnedDeltaPct }
}

export function homeJobStatusLabel(job: RecentJobRow): string {
  if (job.jobStatus === 'in_progress') return 'In progress'
  if (job.status === 'scheduled') return 'Scheduled'
  if (job.status === 'paid') return 'Paid'
  if (job.status === 'invoiced') return 'Invoiced'
  if (job.status === 'overdue') return 'Awaiting payment'
  return 'Complete'
}

export function homeJobStatusClass(job: RecentJobRow): string {
  if (job.jobStatus === 'in_progress') return 'badge-status badge-status--blue'
  if (job.status === 'scheduled') return 'badge-status badge-status--amber'
  if (job.status === 'paid' || job.status === 'completed') return 'badge-status badge-status--green'
  return 'badge-status badge-status--yellow'
}

export function homeJobIconTone(job: RecentJobRow): 'green' | 'amber' | 'blue' | 'gray' {
  if (job.jobStatus === 'in_progress') return 'blue'
  if (job.status === 'scheduled') return 'amber'
  if (job.status === 'paid' || job.status === 'completed') return 'green'
  return 'gray'
}

export function buildInventoryAlert(
  todayJob: TodayJobCardData | null,
  supplies: Supply[],
  packages: Package[]
): InventoryAlertData | null {
  if (!todayJob) return null

  const pkg = packages.find((p) => p.id === todayJob.packageId)
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
  const variant = hasOut ? 'danger' : 'warning'

  return {
    variant,
    title: hasOut
      ? `${flagged.filter((f) => f.out).length} item${flagged.filter((f) => f.out).length === 1 ? '' : 's'} out of stock for today`
      : `${flagged.length} item${flagged.length === 1 ? '' : 's'} running low for today`,
    subtitle: names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : ''),
    supplyIds: flagged.map((f) => f.supply.id),
  }
}

export function pickTipInsight(insights: string[]): string | null {
  if (insights.length === 0) return null
  const best = insights.find((i) => i.startsWith('Best-performing service:'))
  return best ?? insights[0]
}

export function todayJobDetailsLine(job: TodayJobCardData): string {
  return `${job.packageName} · ${job.vehicleType} · ${job.locationLabel}`
}

export function comingUpDetailsLine(job: ComingUpJobData): string {
  const timePart = job.datetimeLabel.includes('·')
    ? job.datetimeLabel.split('·').pop()?.trim()
    : job.datetimeLabel
  return `${job.packageName} · ${timePart ?? job.locationLabel}`
}
