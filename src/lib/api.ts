import type {
  Client,
  ClientInput,
  ClientWithStats,
  JobEditData,
  JobWithRelations,
  Package,
  QuickJobData,
  QuickJobFormValues,
  ClientFormValues,
} from '@rinse/core'
import { generatePocketBaseId, mapJobStatusForDisplay, fmt } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { executeWrite } from './write-router'
import { requireOrganizationId } from './org'
import { requireOrganizationIdForWrite } from './org-write'
import { defaultQuickJobStatus, jobPbCreateFields } from './job-create'
import { listMirrorRecords, getMirrorRecord, upsertMirrorRecord } from './offline/mirror'
import { mapInvoiceFromRecord } from './invoices-api'
import { enrichClientWithStats } from './client-stats'
import { deleteMirrorRecord } from './offline/mirror'
import { enqueue } from './offline/queue'
import { buildSmsComposeUrl } from './sms-compose'

function mapClient(record: Record<string, unknown>): Client {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    phone: record.phone ? String(record.phone) : undefined,
    email: record.email ? String(record.email) : undefined,
    address: record.address ? String(record.address) : undefined,
    lead_source: record.lead_source ? String(record.lead_source) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    created: record.created ? String(record.created) : undefined,
  }
}

function mapPackage(record: Record<string, unknown>): Package {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    base_price: Number(record.base_price ?? 0),
    description: record.description ? String(record.description) : undefined,
    expected_return_days: Number(record.expected_return_days ?? 30),
    duration_minutes: Number(record.duration_minutes ?? 60),
    default_supplies: Array.isArray(record.default_supplies)
      ? (record.default_supplies as Package['default_supplies'])
      : undefined,
    active: Boolean(record.active ?? true),
  }
}

function mapJob(record: Record<string, unknown>, expand?: Record<string, unknown>): JobWithRelations {
  const clientExpand = expand?.client_id as Record<string, unknown> | undefined
  const packageExpand = expand?.package_id as Record<string, unknown> | undefined
  const invoiceExpand = expand?.invoice_id as Record<string, unknown> | undefined

  const job: JobWithRelations = {
    id: String(record.id),
    date: String(record.date ?? ''),
    start_time: record.start_time ? String(record.start_time) : undefined,
    hours_worked: Number(record.hours_worked ?? 0),
    location_type: (record.location_type as JobWithRelations['location_type']) ?? 'mobile',
    package_id: String(record.package_id ?? ''),
    vehicle_type: (record.vehicle_type as JobWithRelations['vehicle_type']) ?? 'sedan',
    client_id: String(record.client_id ?? ''),
    status: (record.status as JobWithRelations['status']) ?? 'scheduled',
    revenue: Number(record.revenue ?? 0),
    tip: Number(record.tip ?? 0),
    expenses: Array.isArray(record.expenses) ? (record.expenses as JobWithRelations['expenses']) : [],
    supplies_used: Array.isArray(record.supplies_used)
      ? (record.supplies_used as JobWithRelations['supplies_used'])
      : [],
    travel_cost: Number(record.travel_cost ?? 0),
    marketing_cost: Number(record.marketing_cost ?? 0),
    equipment_depreciation: Number(record.equipment_depreciation ?? 0),
    notes: record.notes ? String(record.notes) : undefined,
    photo_count: Number(record.photo_count ?? 0),
    invoice_id: record.invoice_id ? String(record.invoice_id) : undefined,
    created: record.created ? String(record.created) : undefined,
    updated: record.updated ? String(record.updated) : undefined,
  }

  if (clientExpand) {
    job.client = mapClient(clientExpand)
  } else if (record.client_id) {
    const cached = getMirrorRecord<Record<string, unknown>>('clients', String(record.client_id))
    if (cached) job.client = mapClient(cached)
  }

  if (packageExpand) {
    job.package = mapPackage(packageExpand)
  } else if (record.package_id) {
    const cached = getMirrorRecord<Record<string, unknown>>('packages', String(record.package_id))
    if (cached) job.package = mapPackage(cached)
  }

  if (invoiceExpand) {
    job.invoice = mapInvoiceFromRecord(invoiceExpand)
  }

  return job
}

async function cachePbList<T extends Record<string, unknown>>(
  collection: string,
  items: T[],
  orgId: string
): Promise<void> {
  for (const item of items) {
    upsertMirrorRecord(collection, String(item.id), orgId, item)
  }
}

export async function listPackages(): Promise<Package[]> {
  const pb = getPocketBase()
  const online = await isOnline()
  if (online) {
    try {
      const orgId = requireOrganizationId()
      const result = await pb.collection('packages').getFullList({ sort: 'name' })
      const items = result.map((item) => mapPackage(item as Record<string, unknown>))
      await cachePbList('packages', result as Record<string, unknown>[], orgId)
      return items.filter((p) => p.active)
    } catch {
      // fall through to mirror
    }
  }

  return listMirrorRecords<Record<string, unknown>>('packages')
    .map(mapPackage)
    .filter((p) => p.active)
}

export async function listJobs(limit = 50): Promise<JobWithRelations[]> {
  const pb = getPocketBase()
  const online = await isOnline()

  if (online) {
    try {
      const orgId = requireOrganizationId()
      const result = await pb.collection('jobs').getList(1, limit, {
        sort: '-date',
        expand: 'client_id,package_id,invoice_id',
      })
      const jobs = result.items.map((item) => mapJob(item as Record<string, unknown>, item.expand))
      await cachePbList('jobs', result.items as Record<string, unknown>[], orgId)
      return jobs
    } catch {
      // fall through
    }
  }

  return listMirrorRecords<Record<string, unknown>>('jobs', limit)
    .map((row) => mapJob(row))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getJob(id: string): Promise<JobWithRelations | null> {
  const pb = getPocketBase()
  const online = await isOnline()

  if (online) {
    try {
      const orgId = requireOrganizationId()
      const item = await pb.collection('jobs').getOne(id, { expand: 'client_id,package_id,invoice_id' })
      upsertMirrorRecord('jobs', id, orgId, item as Record<string, unknown>)
      return mapJob(item as Record<string, unknown>, item.expand)
    } catch {
      // fall through
    }
  }

  const cached = getMirrorRecord<Record<string, unknown>>('jobs', id)
  return cached ? mapJob(cached) : null
}

export async function listClients(limit = 100): Promise<Client[]> {
  const pb = getPocketBase()
  const online = await isOnline()

  if (online) {
    try {
      const orgId = requireOrganizationId()
      const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const result = await pb.collection('clients').getList(1, limit, {
        sort: 'name',
        filter: `organization_id = "${escaped}"`,
      })
      await cachePbList('clients', result.items as Record<string, unknown>[], orgId)
      return result.items.map((item) => mapClient(item as Record<string, unknown>))
    } catch {
      // fall through
    }
  }

  return listMirrorRecords<Record<string, unknown>>('clients', limit)
    .map(mapClient)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getClient(id: string): Promise<Client | null> {
  const pb = getPocketBase()
  const online = await isOnline()

  if (online) {
    try {
      const orgId = requireOrganizationId()
      const item = await pb.collection('clients').getOne(id)
      upsertMirrorRecord('clients', id, orgId, item as Record<string, unknown>)
      return mapClient(item as Record<string, unknown>)
    } catch {
      // fall through
    }
  }

  const cached = getMirrorRecord<Record<string, unknown>>('clients', id)
  return cached ? mapClient(cached) : null
}

export async function createClient(input: ClientFormValues): Promise<Client> {
  const orgId = await requireOrganizationIdForWrite()
  const recordId = generatePocketBaseId()
  const payload: ClientInput = {
    name: input.name.trim(),
    phone: input.phone,
    email: input.email,
    address: input.address,
    lead_source: input.lead_source,
    notes: input.notes,
  }

  const mirrorData: Record<string, unknown> = {
    ...payload,
    id: recordId,
    organization_id: orgId,
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    address: payload.address ?? '',
    notes: payload.notes ?? '',
  }

  const result = await executeWrite({
    recordId,
    collection: 'clients',
    mirrorData,
    pocketbase: async () => {
      const pb = getPocketBase()
      const created = await pb.collection('clients').create({
        id: recordId,
        organization_id: orgId,
        name: payload.name,
        phone: payload.phone ?? '',
        email: payload.email ?? '',
        address: payload.address ?? '',
        notes: payload.notes ?? '',
        tags: [],
        ...(payload.lead_source ? { lead_source: payload.lead_source } : {}),
      })
      return mapClient(created as Record<string, unknown>)
    },
    buildQueue: () => ({
      type: 'createClient',
      recordId,
      params: { ...payload, organization_id: orgId },
    }),
  })

  return mapClient(result as unknown as Record<string, unknown>)
}

export async function updateClient(id: string, input: Partial<ClientFormValues>): Promise<Client> {
  const orgId = requireOrganizationId()
  const existing = await getClient(id)
  if (!existing) throw new Error('Client not found')

  const merged: ClientInput = {
    name: input.name?.trim() ?? existing.name,
    phone: input.phone ?? existing.phone,
    email: input.email ?? existing.email,
    address: input.address ?? existing.address,
    lead_source: input.lead_source ?? existing.lead_source,
    notes: input.notes ?? existing.notes,
  }

  const mirrorData: Record<string, unknown> = {
    ...existing,
    ...merged,
    id,
    organization_id: orgId,
    updated: new Date().toISOString(),
  }

  const result = await executeWrite({
    recordId: id,
    collection: 'clients',
    mirrorData,
    pocketbase: async () => {
      const pb = getPocketBase()
      const updated = await pb.collection('clients').update(id, {
        name: merged.name,
        phone: merged.phone ?? '',
        email: merged.email ?? '',
        address: merged.address ?? '',
        notes: merged.notes ?? '',
        ...(merged.lead_source ? { lead_source: merged.lead_source } : {}),
      })
      return mapClient(updated as Record<string, unknown>)
    },
    buildQueue: () => ({
      type: 'updateClient',
      params: { id, data: merged },
    }),
  })

  return mapClient(result as unknown as Record<string, unknown>)
}

export async function createJob(input: QuickJobFormValues, clientName: string): Promise<JobWithRelations> {
  const orgId = requireOrganizationId()
  const recordId = generatePocketBaseId()

  const quickData: QuickJobData = {
    clientId: input.clientId,
    clientName,
    packageId: input.packageId,
    vehicleType: input.vehicleType as QuickJobData['vehicleType'],
    locationType: input.locationType,
    revenue: input.revenue,
    tip: input.tip ?? 0,
    date: input.date,
    start_time: input.start_time,
    notes: input.notes,
    travel_cost: input.travel_cost,
    marketing_cost: input.marketing_cost,
    equipment_depreciation: input.equipment_depreciation,
    recurrence_cadence:
      input.recurrence_cadence && input.recurrence_cadence !== 'none'
        ? input.recurrence_cadence
        : undefined,
  }

  const mirrorData: Record<string, unknown> = {
    id: recordId,
    organization_id: orgId,
    date: quickData.date,
    location_type: quickData.locationType,
    package_id: quickData.packageId,
    vehicle_type: quickData.vehicleType,
    client_id: quickData.clientId,
    status: defaultQuickJobStatus(quickData.date),
    revenue: quickData.revenue,
    tip: quickData.tip,
    start_time: quickData.start_time ?? '',
    notes: quickData.notes ?? '',
    travel_cost: quickData.travel_cost ?? 0,
    marketing_cost: quickData.marketing_cost ?? 0,
    equipment_depreciation: quickData.equipment_depreciation ?? 0,
    expenses: [],
    supplies_used: [],
    photo_count: 0,
    updated: new Date().toISOString(),
  }

  const result = await executeWrite({
    recordId,
    collection: 'jobs',
    mirrorData,
    pocketbase: async () => {
      const pb = getPocketBase()
      const created = await pb.collection('jobs').create({
        id: recordId,
        organization_id: orgId,
        ...jobPbCreateFields({
          date: quickData.date,
          locationType: quickData.locationType,
          packageId: quickData.packageId,
          vehicleType: quickData.vehicleType,
          clientId: quickData.clientId!,
          revenue: quickData.revenue,
          tip: quickData.tip,
          start_time: quickData.start_time,
          notes: quickData.notes,
          travel_cost: quickData.travel_cost,
          marketing_cost: quickData.marketing_cost,
          equipment_depreciation: quickData.equipment_depreciation,
          recurrence_cadence: quickData.recurrence_cadence,
          recurrence_anchor_date: quickData.recurrence_anchor_date,
        }),
      })
      return mapJob(created as Record<string, unknown>)
    },
    buildQueue: () => ({
      type: 'createJob',
      recordId,
      params: { ...quickData, organization_id: orgId },
    }),
  })

  return mapJob(result as unknown as Record<string, unknown>)
}

export async function updateJob(id: string, data: JobEditData): Promise<JobWithRelations> {
  const orgId = requireOrganizationId()
  const existing = await getJob(id)
  if (!existing) throw new Error('Job not found')

  const mirrorData: Record<string, unknown> = {
    ...existing,
    ...data,
    id,
    organization_id: orgId,
    updated: new Date().toISOString(),
  }

  const result = await executeWrite({
    recordId: id,
    collection: 'jobs',
    mirrorData,
    pocketbase: async () => {
      const pb = getPocketBase()
      const patch: Record<string, unknown> = {}
      if (data.date !== undefined) patch.date = data.date
      if (data.status !== undefined) patch.status = data.status
      if (data.revenue !== undefined) patch.revenue = data.revenue
      if (data.tip !== undefined) patch.tip = data.tip
      if (data.notes !== undefined) patch.notes = data.notes
      if (data.start_time !== undefined) patch.start_time = data.start_time
      if (data.locationType !== undefined) patch.location_type = data.locationType
      if (data.vehicleType !== undefined) patch.vehicle_type = data.vehicleType
      if (data.packageId !== undefined) patch.package_id = data.packageId
      if (data.hours_worked !== undefined) patch.hours_worked = data.hours_worked
      const updated = await pb.collection('jobs').update(id, patch)
      return mapJob(updated as Record<string, unknown>)
    },
    buildQueue: () => ({
      type: 'updateJob',
      params: { id, data },
    }),
  })

  return mapJob(result as unknown as Record<string, unknown>)
}

export async function listClientsWithStats(): Promise<ClientWithStats[]> {
  const [clients, jobs, packages] = await Promise.all([listClients(500), listJobs(500), listPackages()])
  return clients.map((client) => {
    const clientJobs = jobs.filter((j) => j.client_id === client.id)
    return enrichClientWithStats(client, clientJobs, packages)
  })
}

export async function getClientJobs(clientId: string): Promise<JobWithRelations[]> {
  const pb = getPocketBase()
  const online = await isOnline()

  if (online) {
    try {
      const orgId = requireOrganizationId()
      const escaped = clientId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const result = await pb.collection('jobs').getFullList({
        filter: `organization_id = "${orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" && client_id = "${escaped}"`,
        sort: '-date',
        expand: 'client_id,package_id,invoice_id',
      })
      const jobs = result.map((item) => mapJob(item as Record<string, unknown>, item.expand))
      await cachePbList('jobs', result as Record<string, unknown>[], orgId)
      return jobs
    } catch {
      // fall through
    }
  }

  return listMirrorRecords<Record<string, unknown>>('jobs')
    .map((row) => mapJob(row))
    .filter((j) => j.client_id === clientId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function deleteJob(id: string): Promise<{ ok: boolean; error?: string }> {
  const online = await isOnline()
  if (online) {
    try {
      const pb = getPocketBase()
      await pb.collection('jobs').delete(id)
      deleteMirrorRecord('jobs', id)
      return { ok: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not delete job'
      return { ok: false, error: msg }
    }
  }

  try {
    await enqueue({ type: 'deleteJob', params: { id } })
    deleteMirrorRecord('jobs', id)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not queue delete' }
  }
}

export async function completeJob(id: string, suppliesUsed?: JobWithRelations['supplies_used']): Promise<JobWithRelations> {
  const existing = await getJob(id)
  if (!existing) throw new Error('Job not found')
  return updateJob(id, {
    date: existing.date,
    packageId: existing.package_id,
    vehicleType: existing.vehicle_type,
    locationType: existing.location_type,
    revenue: existing.revenue,
    tip: existing.tip,
    hours_worked: existing.hours_worked,
    start_time: existing.start_time,
    status: 'completed',
    notes: existing.notes,
    supplies_used: suppliesUsed ?? existing.supplies_used,
    travel_cost: existing.travel_cost,
    marketing_cost: existing.marketing_cost,
    equipment_depreciation: existing.equipment_depreciation,
    recurrence_cadence: existing.recurrence_cadence,
    recurrence_anchor_date: existing.recurrence_anchor_date,
  })
}

export async function importClientsFromCsv(csv: string): Promise<number> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return 0
  let count = 0
  for (const line of lines.slice(1)) {
    const cols = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"')) ?? []
    const [name, phone, email, address, notes] = cols
    if (!name?.trim()) continue
    await createClient({
      name: name.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })
    count++
  }
  return count
}

export function jobListSubtitle(job: JobWithRelations): string {
  const client = job.client?.name ?? 'Unknown client'
  const pkg = job.package?.name ?? 'Service'
  return `${client} · ${pkg}`
}

export function jobListMeta(job: JobWithRelations): string {
  const status = mapJobStatusForDisplay(job)
  return `${status.replace('_', ' ')} · ${fmt(job.revenue + job.tip)}`
}

export async function deleteClient(id: string): Promise<{ ok: boolean; error?: string }> {
  const online = await isOnline()
  if (online) {
    try {
      const pb = getPocketBase()
      await pb.collection('clients').delete(id)
      deleteMirrorRecord('clients', id)
      return { ok: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not delete client'
      return { ok: false, error: msg }
    }
  }

  try {
    await enqueue({ type: 'deleteClient', params: { id } })
    deleteMirrorRecord('clients', id)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not queue delete' }
  }
}

export function openPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Prefer E.164-ish for iOS; 10-digit US numbers get a leading +1.
  if (digits.length === 10) return `tel:+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`
  return `tel:${digits}`
}

/** iOS needs `?&body=` — see buildSmsComposeUrl. */
export function openSms(phone: string, body?: string): string {
  const url = buildSmsComposeUrl(phone, body ?? '')
  if (url) return url
  const digits = phone.replace(/\D/g, '')
  return `sms:${digits}`
}

export function openMaps(address: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`
}
