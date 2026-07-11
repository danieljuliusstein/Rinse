import { mapJobStatusForDisplay, type JobWithRelations } from '@rinse/core'
import type { BadgeTone } from '@/src/theme/tokens'

const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/

/** PocketBase / mirror may return full ISO timestamps in `date`. */
export function normalizeJobDate(dateStr: string): string {
  const match = dateStr.match(ISO_DATE_PREFIX)
  return match ? match[1] : dateStr
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatJobsDayLabel(dateStr: string): string {
  const date = normalizeJobDate(dateStr)
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function jobListRightTime(job: JobWithRelations): string {
  const date = normalizeJobDate(job.date)
  const today = todayStr()
  if (date === today && job.start_time) {
    const [h, m] = job.start_time.split(':').map(Number)
    if (!Number.isNaN(h)) {
      const dt = new Date()
      dt.setHours(h, m ?? 0)
      return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function jobListStatusLabel(job: JobWithRelations): string {
  if (job.invoice?.status === 'overdue') return 'Awaiting payment'
  if (job.status === 'in_progress') return 'In progress'
  const display = mapJobStatusForDisplay(job)
  if (display === 'scheduled') return 'Scheduled'
  if (display === 'paid') return 'Paid'
  if (display === 'invoiced') return 'Invoiced'
  if (display === 'overdue') return 'Awaiting payment'
  return 'Complete'
}

export function jobListBadgeTone(job: JobWithRelations): BadgeTone {
  if (job.invoice?.status === 'overdue') return 'red'
  if (job.status === 'in_progress') return 'blue'
  const display = mapJobStatusForDisplay(job)
  if (display === 'paid' || display === 'completed') return 'green'
  if (display === 'scheduled') return 'amber'
  return 'yellow'
}

export function jobListRowSubtitle(job: JobWithRelations): string {
  const pkg = job.package?.name ?? 'Detail'
  const vehicle = capitalize(job.vehicle_type ?? 'vehicle')
  return `${pkg} · ${vehicle}`
}

import type { ListRowIconTone } from '@/src/theme/tokens'

export function jobListIconTone(job: JobWithRelations): ListRowIconTone {
  if (job.status === 'in_progress') return 'blue'
  const display = mapJobStatusForDisplay(job)
  if (display === 'paid' || display === 'completed') return 'green'
  if (display === 'scheduled') return 'amber'
  return 'blue'
}

export function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}
