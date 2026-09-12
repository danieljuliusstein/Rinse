import type { JobDisplayStatus } from './job-status-display'

export type JobIconTone = 'green' | 'amber' | 'blue' | 'gray'

export function jobIconTone(status: JobDisplayStatus): JobIconTone {
  if (status === 'in_progress') return 'blue'
  if (status === 'paid' || status === 'completed') return 'green'
  if (status === 'invoiced' || status === 'overdue') return 'amber'
  if (status === 'scheduled') return 'blue'
  return 'gray'
}
