import { ensurePocketBaseAuth } from './pb-auth'
import { getPocketBase } from './pocketbase'
import { appJobCreateToPb, escapeFilterValue, pbClientToApp, pbJobToApp, pbPackageToApp, type PbRecord } from './api/mappers'
import { tenantFilter } from './api/tenant-pocketbase'
import {
  computeAvailability,
  DEFAULT_BOOKING_SCHEDULE,
  DEFAULT_PACKAGE_DURATION_MINUTES,
  normalizeBookingSchedule,
  slotLabel,
  type AvailabilityBlock,
  type AvailabilityJob,
  type AvailabilitySlot,
} from './booking-availability'

export type { AvailabilitySlot }

/** @deprecated Use schedule-driven slots from computeAvailability */
export const BOOKING_SLOT_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00']

export interface PublicPackage {
  id: string
  name: string
  base_price: number
  description?: string
  duration_minutes?: number
}

export interface PublicBusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  logoUrl: string
  accentColor?: string | null
}

export interface PublicBookingInput {
  packageId: string
  date: string
  startTime: string
  locationType: 'mobile' | 'fixed'
  vehicleType: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getPublicBusinessInfo(): Promise<PublicBusinessInfo | null> {
  if (!(await ensurePocketBaseAuth())) return null
  try {
    const records = await pb().collection('app_settings').getFullList<PbRecord>({
      filter: tenantFilter(),
      limit: 1,
    })
    if (!records.length) return null
    const record = records[0]
    return {
      name: String(record.business_name ?? ''),
      phone: String(record.business_phone ?? ''),
      email: String(record.business_email ?? ''),
      address: String(record.business_address ?? ''),
      logoUrl: '/logo.png',
    }
  } catch {
    return null
  }
}

export async function listPublicPackages(): Promise<PublicPackage[]> {
  if (!(await ensurePocketBaseAuth())) return []
  const records = await pb().collection('packages').getFullList<PbRecord>({
    filter: tenantFilter(),
    sort: 'name',
  })
  return records
    .map(pbPackageToApp)
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      base_price: p.base_price,
      description: p.description,
      duration_minutes: p.duration_minutes,
    }))
}

export async function getAvailabilityForDate(date: string, packageId?: string): Promise<AvailabilitySlot[]> {
  if (!(await ensurePocketBaseAuth())) {
    return BOOKING_SLOT_TIMES.map((time) => ({ time, label: slotLabel(time), available: false }))
  }

  const settingsRecords = await pb().collection('app_settings').getFullList<PbRecord>({
    filter: tenantFilter(),
    limit: 1,
  })
  const schedule = normalizeBookingSchedule(
    settingsRecords[0]?.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE,
  )

  let packageDurationMinutes = DEFAULT_PACKAGE_DURATION_MINUTES
  if (packageId) {
    try {
      const pkg = await pb().collection('packages').getOne<PbRecord>(packageId)
      const mins = Number(pkg.duration_minutes)
      if (mins > 0) packageDurationMinutes = mins
    } catch {
      // use default
    }
  }

  const escaped = escapeFilterValue(date)
  const jobs = await pb().collection('jobs').getFullList<PbRecord>({
    filter: `${tenantFilter()} && date = "${escaped}" && (status = "scheduled" || status = "in_progress")`,
    expand: 'package_id',
  })

  const blocks = await pb().collection('time_blocks').getFullList<PbRecord>({
    filter: `${tenantFilter()} && date = "${escaped}"`,
  })

  const availabilityJobs: AvailabilityJob[] = jobs.map((j) => {
    const expanded = j.expand?.package_id as PbRecord | undefined
    const pkgDuration = expanded ? Number(expanded.duration_minutes) : undefined
    return {
      start_time: String(j.start_time ?? ''),
      status: String(j.status ?? ''),
      duration_minutes: pkgDuration && pkgDuration > 0 ? pkgDuration : undefined,
    }
  })

  const availabilityBlocks: AvailabilityBlock[] = blocks.map((b) => ({
    date: String(b.date ?? ''),
    start_time: b.start_time ? String(b.start_time) : undefined,
    end_time: b.end_time ? String(b.end_time) : undefined,
    all_day: Boolean(b.all_day),
  }))

  return computeAvailability({
    schedule,
    date,
    packageDurationMinutes,
    jobs: availabilityJobs,
    blocks: availabilityBlocks,
  })
}

export async function createPublicBooking(input: PublicBookingInput) {
  if (!(await ensurePocketBaseAuth())) {
    throw new Error('Booking is temporarily unavailable')
  }

  const pkg = await pb().collection('packages').getOne<PbRecord>(input.packageId)
  const packageApp = pbPackageToApp(pkg)

  const phone = input.phone.trim()
  const name = input.name.trim()
  if (!name || !phone) throw new Error('Name and phone are required')

  let clientRecord: PbRecord | null = null
  const phoneEsc = escapeFilterValue(phone)
  const matches = await pb().collection('clients').getFullList<PbRecord>({
    filter: `${tenantFilter()} && phone = "${phoneEsc}"`,
    limit: 1,
  })
  if (matches.length > 0) {
    clientRecord = matches[0]
    await pb().collection('clients').update(clientRecord.id, {
      name,
      email: input.email?.trim() ?? clientRecord.email ?? '',
      address: input.address?.trim() ?? clientRecord.address ?? '',
    })
  } else {
    clientRecord = await pb().collection('clients').create<PbRecord>({
      name,
      phone,
      email: input.email?.trim() ?? '',
      address: input.address?.trim() ?? '',
      lead_source: 'other',
      tags: [],
      notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
    })
  }

  const client = pbClientToApp(clientRecord)
  const slots = await getAvailabilityForDate(input.date, input.packageId)
  const slot = slots.find((s) => s.time === input.startTime)
  if (!slot?.available) throw new Error('That time slot is no longer available')

  const payload = appJobCreateToPb({
    date: input.date,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: client.id,
    status: 'scheduled',
    revenue: packageApp.base_price,
    tip: 0,
    start_time: input.startTime,
    notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
  })

  const jobRecord = await pb().collection('jobs').create<PbRecord>(payload as Record<string, unknown>)
  const job = pbJobToApp(jobRecord)

  return {
    jobId: job.id,
    clientId: client.id,
    date: job.date,
    startTime: job.start_time,
    packageName: packageApp.name,
    clientName: client.name,
  }
}
