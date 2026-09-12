import { businessLogoApiUrl, pocketBaseRecordHasLogo } from '../business-logo'
import { authenticateServerAdmin } from './pocketbase-admin'
import { escapeFilterValue, appJobCreateToPb, pbClientToApp, pbJobToApp, pbPackageToApp, type PbRecord } from '../api/mappers'
import {
  computeAvailability,
  DEFAULT_BOOKING_SCHEDULE,
  DEFAULT_PACKAGE_DURATION_MINUTES,
  normalizeBookingSchedule,
  type AvailabilityBlock,
  type AvailabilityJob,
  type AvailabilitySlot,
} from '../booking-availability'
import type { PublicBookingInput, PublicBusinessInfo, PublicPackage } from '../booking-public'
export type { PublicBookingInput, PublicBusinessInfo, PublicPackage }

function orgFilter(organizationId: string, extra?: string): string {
  const orgEsc = escapeFilterValue(organizationId)
  const base = `organization_id = "${orgEsc}"`
  return extra ? `${base} && (${extra})` : base
}

async function loadOrgSettings(pb: Awaited<ReturnType<typeof authenticateServerAdmin>>, organizationId: string) {
  const records = await pb.collection('app_settings').getFullList<PbRecord>({
    filter: orgFilter(organizationId),
    limit: 1,
  })
  const record = records[0]
  return {
    schedule: normalizeBookingSchedule(record?.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE),
    travel_rate_per_mile:
      typeof record?.travel_rate_per_mile === 'number' ? record.travel_rate_per_mile : undefined,
  }
}

async function loadPackageDurationMinutes(
  pb: Awaited<ReturnType<typeof authenticateServerAdmin>>,
  organizationId: string,
  packageId?: string,
): Promise<number> {
  if (!packageId) return DEFAULT_PACKAGE_DURATION_MINUTES
  try {
    const pkg = await pb.collection('packages').getOne<PbRecord>(packageId)
    if (String(pkg.organization_id) !== organizationId) return DEFAULT_PACKAGE_DURATION_MINUTES
    const mins = Number(pkg.duration_minutes)
    return mins > 0 ? mins : DEFAULT_PACKAGE_DURATION_MINUTES
  } catch {
    return DEFAULT_PACKAGE_DURATION_MINUTES
  }
}

export async function getPublicBusinessInfoForOrg(
  organizationId: string,
  orgSlug: string
): Promise<PublicBusinessInfo | null> {
  const pb = await authenticateServerAdmin()
  const records = await pb.collection('app_settings').getFullList<PbRecord>({
    filter: orgFilter(organizationId),
    limit: 1,
  })
  if (!records.length) return null
  const record = records[0]
  const hasLogo = pocketBaseRecordHasLogo(record.logo)
  return {
    name: String(record.business_name ?? ''),
    phone: String(record.business_phone ?? ''),
    email: String(record.business_email ?? ''),
    address: String(record.business_address ?? ''),
    logoUrl: hasLogo ? businessLogoApiUrl(orgSlug, record.updated) : '/logo.png',
    accentColor: record.accent_color ? String(record.accent_color) : null,
  }
}

export async function listPublicPackagesForOrg(organizationId: string): Promise<PublicPackage[]> {
  const pb = await authenticateServerAdmin()
  const records = await pb.collection('packages').getFullList<PbRecord>({
    filter: orgFilter(organizationId, 'active = true'),
    sort: 'name',
  })
  return records.map(pbPackageToApp).map((p) => ({
    id: p.id,
    name: p.name,
    base_price: p.base_price,
    description: p.description,
    duration_minutes: p.duration_minutes,
  }))
}

export async function getAvailabilityForOrg(
  organizationId: string,
  date: string,
  packageId?: string,
): Promise<AvailabilitySlot[]> {
  const pb = await authenticateServerAdmin()
  const { schedule } = await loadOrgSettings(pb, organizationId)
  const packageDurationMinutes = await loadPackageDurationMinutes(pb, organizationId, packageId)

  const escaped = escapeFilterValue(date)
  const jobs = await pb.collection('jobs').getFullList<PbRecord>({
    filter: orgFilter(
      organizationId,
      `date = "${escaped}" && (status = "scheduled" || status = "in_progress")`,
    ),
    expand: 'package_id',
  })

  const blocks = await pb.collection('time_blocks').getFullList<PbRecord>({
    filter: orgFilter(organizationId, `date = "${escaped}"`),
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

export async function createPublicBookingForOrg(organizationId: string, input: PublicBookingInput) {
  const pb = await authenticateServerAdmin()

  const pkg = await pb.collection('packages').getOne<PbRecord>(input.packageId)
  if (String(pkg.organization_id) !== organizationId) {
    throw new Error('Invalid package')
  }
  const packageApp = pbPackageToApp(pkg)

  const phone = input.phone.trim()
  const name = input.name.trim()
  if (!name || !phone) throw new Error('Name and phone are required')

  const phoneEsc = escapeFilterValue(phone)
  let clientRecord: PbRecord | null = null
  const matches = await pb.collection('clients').getFullList<PbRecord>({
    filter: orgFilter(organizationId, `phone = "${phoneEsc}"`),
    limit: 1,
  })

  if (matches.length > 0) {
    clientRecord = matches[0]
    await pb.collection('clients').update(clientRecord.id, {
      name,
      email: input.email?.trim() ?? clientRecord.email ?? '',
      address: input.address?.trim() ?? clientRecord.address ?? '',
    })
  } else {
    clientRecord = await pb.collection('clients').create<PbRecord>({
      organization_id: organizationId,
      name,
      phone,
      email: input.email?.trim() ?? '',
      address: input.address?.trim() ?? '',
      lead_source: 'website',
      tags: [],
      notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
    })
  }

  const client = pbClientToApp(clientRecord)
  const slots = await getAvailabilityForOrg(organizationId, input.date, input.packageId)
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

  const jobRecord = await pb.collection('jobs').create<PbRecord>({
    ...(payload as Record<string, unknown>),
    organization_id: organizationId,
  })
  const job = pbJobToApp(jobRecord)

  try {
    await pb.collection('leads').create({
      organization_id: organizationId,
      name: client.name,
      phone: client.phone ?? '',
      email: client.email ?? '',
      source: 'website',
      vehicle_type: input.vehicleType,
      package_id: input.packageId,
      quote_amount: packageApp.base_price,
      stage: 'booked',
      client_id: client.id,
      job_id: job.id,
      service_interest: packageApp.name,
      notes: input.notes?.trim() ? `Web booking: ${input.notes.trim()}` : 'Web booking',
    })
  } catch {
    // leads collection may be unavailable before migration
  }

  return {
    jobId: job.id,
    clientId: client.id,
    date: job.date,
    startTime: job.start_time,
    packageName: packageApp.name,
    clientName: client.name,
  }
}
