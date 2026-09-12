import type { DamageRecord, Job } from './types'

/** Prefer server upload time for liability; fall back to created/captured. */
export function liabilityTimestamp(record: {
  uploaded_at?: string
  created?: string
  captured_at?: string
  date?: string
}): string | undefined {
  return record.uploaded_at || record.created || record.captured_at || undefined
}

export function formatLiabilityTimestamp(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function jobHasPreJobInspection(job: Pick<Job, 'inspection_completed_at'>): boolean {
  return Boolean(job.inspection_completed_at?.trim())
}

/** True when moving into in_progress requires a completed walkthrough. */
export function requiresPreJobInspection(
  fromStatus: Job['status'] | undefined,
  toStatus: Job['status'],
): boolean {
  if (toStatus !== 'in_progress') return false
  return fromStatus !== 'in_progress'
}

export function sortDamageByLiabilityTime(docs: DamageRecord[]): DamageRecord[] {
  return [...docs].sort((a, b) => {
    const ta = liabilityTimestamp(a) ?? ''
    const tb = liabilityTimestamp(b) ?? ''
    return tb.localeCompare(ta)
  })
}
