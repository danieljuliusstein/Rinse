import { nextRecurrenceDate, isRecurringJob } from '../recurrence'
import { authenticateServerPocketBase } from './pocketbase-admin'
import type { PbRecord } from '../api/mappers'

export interface RecurringJobsCronResult {
  spawned: number
  skipped: number
  details: string[]
}

function mapJob(record: PbRecord) {
  return {
    id: String(record.id),
    organization_id: String(record.organization_id ?? ''),
    client_id: String(record.client_id ?? ''),
    package_id: String(record.package_id ?? ''),
    // PocketBase returns date fields as full datetime strings
    // ("2026-01-05 00:00:00.000Z"), not plain "YYYY-MM-DD" — slice to the
    // date portion. nextRecurrenceDate() appends "T12:00:00" to build a
    // Date, and that fails with "Invalid time value" on the raw form.
    date: String(record.date ?? '').slice(0, 10),
    vehicle_type: String(record.vehicle_type ?? 'sedan'),
    location_type: String(record.location_type ?? 'mobile'),
    revenue: Number(record.revenue ?? 0),
    tip: Number(record.tip ?? 0),
    notes: record.notes ? String(record.notes) : undefined,
    start_time: record.start_time ? String(record.start_time) : undefined,
    recurrence_cadence: record.recurrence_cadence ? String(record.recurrence_cadence) : undefined,
    recurrence_anchor_date: record.recurrence_anchor_date
      ? String(record.recurrence_anchor_date).slice(0, 10)
      : undefined,
  }
}

export async function runRecurringJobsCron(today = new Date().toISOString().slice(0, 10)): Promise<RecurringJobsCronResult> {
  const pb = await authenticateServerPocketBase()
  const records = await pb.collection('jobs').getFullList<PbRecord>({
    filter: 'recurrence_cadence != ""',
    sort: 'date',
  })

  let spawned = 0
  let skipped = 0
  const details: string[] = []

  for (const record of records) {
    const job = mapJob(record)
    if (!isRecurringJob(job.recurrence_cadence)) continue
    if (job.date >= today) continue

    const anchor = job.recurrence_anchor_date ?? job.date
    const nextDate = nextRecurrenceDate(anchor, job.recurrence_cadence, job.date)

    const orgEsc = job.organization_id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const clientEsc = job.client_id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const pkgEsc = job.package_id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const dateEsc = nextDate.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    const existing = await pb.collection('jobs').getFullList<PbRecord>({
      filter: `organization_id = "${orgEsc}" && client_id = "${clientEsc}" && package_id = "${pkgEsc}" && date = "${dateEsc}"`,
      limit: 1,
    })

    if (existing.length > 0) {
      skipped += 1
      details.push(`Skip ${job.id} → ${nextDate} (exists)`)
      continue
    }

    await pb.collection('jobs').create({
      organization_id: job.organization_id,
      client_id: job.client_id,
      package_id: job.package_id,
      date: nextDate,
      vehicle_type: job.vehicle_type,
      location_type: job.location_type,
      revenue: job.revenue,
      tip: job.tip,
      notes: job.notes ?? '',
      start_time: job.start_time ?? '',
      status: 'scheduled',
      recurrence_cadence: job.recurrence_cadence,
      recurrence_anchor_date: anchor,
    })

    spawned += 1
    details.push(`Spawned ${nextDate} from ${job.id}`)
  }

  return { spawned, skipped, details }
}
