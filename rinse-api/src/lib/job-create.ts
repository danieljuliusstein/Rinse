import type { JobStatus } from './types'

/** Local calendar date as YYYY-MM-DD (matches weather readiness / home dashboard). */
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
