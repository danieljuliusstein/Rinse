import type { RecentJobRow } from './types'

export type JobDisplayStatus = RecentJobRow['status']

export const JOB_STATUS_CONFIG: Record<
  JobDisplayStatus,
  { label: string; className: string }
> = {
  paid: { label: 'Paid', className: 'badge-status badge-status--green' },
  completed: { label: 'Complete', className: 'badge-status badge-status--green' },
  invoiced: { label: 'Invoiced', className: 'badge-status badge-status--yellow' },
  overdue: { label: 'Awaiting payment', className: 'badge-status badge-status--yellow' },
  scheduled: { label: 'Scheduled', className: 'badge-status badge-status--amber' },
  in_progress: { label: 'In progress', className: 'badge-status badge-status--blue' },
}

export function jobStatusLabel(job: RecentJobRow): string {
  const config = JOB_STATUS_CONFIG[job.status]
  if (job.status === 'scheduled' && job.scheduledDate) return job.scheduledDate
  return config.label
}
