import { ensurePocketBaseAuth } from '../pb-auth'
import { toClientLeadSource } from '../lead-sources'
import { scopedStorageKey } from '../tenant'
import { ensureDefaultCatalog, isCatalogMarkedReady, syncCatalogReadyFlag } from './catalog-ready'
import { getPocketBase } from '../pocketbase'
import { loadData } from '../storage'
import { saveIdMapEntry } from './id-resolve'
import * as pb from './pocketbase'
import { appOverheadToPb, appSupplyToPb, escapeFilterValue } from './mappers'
import { withOrganization } from './tenant-pocketbase'

const MIGRATED_KEY = 'migrated_to_pb_v1'

export function isMigrated(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(scopedStorageKey(MIGRATED_KEY)) === '1'
}

export function markMigrated(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(scopedStorageKey(MIGRATED_KEY), '1')
}

export function clearMigratedFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(scopedStorageKey(MIGRATED_KEY))
  localStorage.removeItem(MIGRATED_KEY)
}

export interface MigrationResult {
  packages: number
  clients: number
  jobs: number
  invoices: number
  supplies: number
  overhead: number
  photos: number
  skipped: boolean
}

export interface MigrationStatus {
  migrated: boolean
  pocketBaseJobCount: number | null
  localJobCount: number
  localClientCount: number
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  const local = loadData()
  let pocketBaseJobCount: number | null = null

  try {
    const counts = await pb.getCollectionCounts()
    pocketBaseJobCount = counts.jobs
  } catch {
    pocketBaseJobCount = null
  }

  return {
    migrated: isMigrated(),
    pocketBaseJobCount,
    localJobCount: local.jobs.length,
    localClientCount: local.clients.length,
  }
}

export async function migrateLocalToPocketBase(): Promise<MigrationResult> {
  const local = loadData()

  if (isMigrated()) {
    try {
      const counts = await pb.getCollectionCounts()
      if (local.jobs.length <= counts.jobs) {
        return { packages: 0, clients: 0, jobs: 0, invoices: 0, supplies: 0, overhead: 0, photos: 0, skipped: true }
      }
    } catch {
      return { packages: 0, clients: 0, jobs: 0, invoices: 0, supplies: 0, overhead: 0, photos: 0, skipped: true }
    }
  }

  if (!(await ensurePocketBaseAuth())) {
    return { packages: 0, clients: 0, jobs: 0, invoices: 0, supplies: 0, overhead: 0, photos: 0, skipped: true }
  }

  const pocketBase = getPocketBase()
  if (!pocketBase) {
    return { packages: 0, clients: 0, jobs: 0, invoices: 0, supplies: 0, overhead: 0, photos: 0, skipped: true }
  }

  const packageIdMap = new Map<string, string>()
  const clientIdMap = new Map<string, string>()
  const jobIdMap = new Map<string, string>()
  const supplyIdMap = new Map<string, string>()

  let clientsCreated = 0
  let jobsCreated = 0
  let invoicesCreated = 0
  let suppliesCreated = 0
  let overheadCreated = 0
  let photosCreated = 0

  await syncCatalogReadyFlag()
  if (!isCatalogMarkedReady()) {
    await ensureDefaultCatalog()
  }

  const pbPackages = await pb.getPackages()
  for (const pkg of local.packages) {
    const match = pbPackages.find((p) => p.name.toLowerCase() === pkg.name.toLowerCase())
    if (match) {
      packageIdMap.set(pkg.id, match.id)
      saveIdMapEntry(pkg.id, match.id, 'package')
    }
  }

  const pbSupplies = await pocketBase.collection('supplies').getFullList({ sort: 'name' })
  for (const supply of local.supplies) {
    const match = pbSupplies.find((s) => String(s.name).toLowerCase() === supply.name.toLowerCase())
    if (match) {
      supplyIdMap.set(supply.id, match.id)
      continue
    }

    const created = await pocketBase.collection('supplies').create(withOrganization(appSupplyToPb(supply)))
    supplyIdMap.set(supply.id, created.id)
    suppliesCreated++
  }

  for (const expense of local.overhead_expenses) {
    const escaped = escapeFilterValue(expense.name)
    const existing = await pocketBase.collection('overhead_expenses').getFullList({
      filter: `name = "${escaped}"`,
      limit: 1,
    })
    if (existing.length > 0) continue

    await pocketBase.collection('overhead_expenses').create(withOrganization(appOverheadToPb(expense)))
    overheadCreated++
  }

  for (const client of local.clients) {
    const escaped = escapeFilterValue(client.name)
    const existing = await pocketBase.collection('clients').getFullList({
      filter: `name = "${escaped}"`,
      limit: 1,
    })

    if (existing.length > 0) {
      clientIdMap.set(client.id, existing[0].id)
      saveIdMapEntry(client.id, existing[0].id, 'client')
      continue
    }

    const clientPayload: Record<string, unknown> = {
      name: client.name,
      phone: client.phone ?? '',
      email: client.email ?? '',
      address: client.address ?? '',
      tags: client.tags ?? [],
      notes: client.notes ?? '',
    }
    const leadSource = toClientLeadSource(client.lead_source)
    if (leadSource) clientPayload.lead_source = leadSource

    const created = await pocketBase.collection('clients').create(withOrganization(clientPayload))
    clientIdMap.set(client.id, created.id)
    saveIdMapEntry(client.id, created.id, 'client')
    clientsCreated++
  }

  for (const job of local.jobs) {
    const packageId = packageIdMap.get(job.package_id)
    const clientId = clientIdMap.get(job.client_id)
    if (!packageId || !clientId) continue

    const escapedClient = escapeFilterValue(clientId)
    const escapedDate = escapeFilterValue(job.date)
    const existingJob = await pocketBase.collection('jobs').getFullList({
      filter: `client_id = "${escapedClient}" && date = "${escapedDate}"`,
      limit: 1,
    })
    if (existingJob.length > 0) {
      jobIdMap.set(job.id, existingJob[0].id)
      saveIdMapEntry(job.id, existingJob[0].id, 'job')
      continue
    }

    const remappedSupplies = job.supplies_used.map((u) => ({
      supply_id: supplyIdMap.get(u.supply_id) ?? u.supply_id,
      quantity_used: u.quantity_used,
    }))

    const created = await pocketBase.collection('jobs').create(withOrganization({
      date: job.date,
      start_time: job.start_time ?? '',
      hours_worked: job.hours_worked,
      location_type: job.location_type,
      package_id: packageId,
      vehicle_type: job.vehicle_type,
      client_id: clientId,
      status: job.status,
      revenue: job.revenue,
      tip: job.tip,
      expenses: job.expenses,
      supplies_used: remappedSupplies,
      travel_cost: job.travel_cost,
      marketing_cost: job.marketing_cost,
      equipment_depreciation: job.equipment_depreciation,
      notes: job.notes ?? '',
      photo_meta: job.photo_meta ?? [],
    }))
    jobIdMap.set(job.id, created.id)
    saveIdMapEntry(job.id, created.id, 'job')
    jobsCreated++
  }

  for (const inv of local.invoices) {
    const jobId = jobIdMap.get(inv.job_id)
    const clientId = clientIdMap.get(inv.client_id)
    if (!jobId || !clientId) continue

    const created = await pocketBase.collection('invoices').create(withOrganization({
      invoice_number: inv.invoice_number,
      job_id: jobId,
      client_id: clientId,
      subtotal: inv.subtotal,
      tip: inv.tip,
      total: inv.total,
      status: inv.status,
      payments: inv.payments,
      amount_paid: inv.amount_paid,
      balance_due: inv.balance_due,
      sent_at: inv.sent_at ?? '',
      paid_at: inv.paid_at ?? '',
      terms: inv.terms ?? 'Due on receipt',
      notes: inv.notes ?? '',
    }))

    await pocketBase.collection('jobs').update(jobId, { invoice_id: created.id })
    saveIdMapEntry(inv.id, created.id, 'invoice')
    invoicesCreated++
  }

  const { uploadJobPhoto } = await import('./photos-pocketbase')

  function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, data] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new File([bytes], filename, { type: mime })
  }

  for (const [localJobId, photos] of Object.entries(local.job_photos)) {
    const pbJobId = jobIdMap.get(localJobId)
    if (!pbJobId || !photos?.length) continue

    for (const photo of photos) {
      try {
        const file = dataUrlToFile(photo.data_url, `${photo.id}.jpg`)
        await uploadJobPhoto(pbJobId, file, photo.type)
        photosCreated++
      } catch (err) {
        console.warn('[migrate] photo upload failed:', err)
      }
    }
  }

  markMigrated()
  return {
    packages: 0,
    clients: clientsCreated,
    jobs: jobsCreated,
    invoices: invoicesCreated,
    supplies: suppliesCreated,
    overhead: overheadCreated,
    photos: photosCreated,
    skipped: false,
  }
}
