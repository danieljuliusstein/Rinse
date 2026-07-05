import { defaultQuickJobStatus } from '../job-create'
import { normalizeInvoice } from '../invoices'
import { rangeDateSpanLabel, rangePeriodLabel } from '../jobs-revenue'
import { loadSettings } from '../settings'
import {
  applySupplyExpenses,
  inventoryDeltaFromUsageChange,
  isCompletedStatus,
  isCompletingJob,
  overheadAmountForDates,
  resolveSuppliesUsed,
} from '../supplies-logic'
import { ensurePocketBaseAuth } from '../pb-auth'
import { toClientLeadSource } from '../lead-sources'
import { rethrowPremiumPocketBaseError } from '../premium-api'
import { getPocketBase } from '../pocketbase'
import {
  computeDashboard,
  computeJobsCSV,
  computeJobsForDate,
  computePLReport,
  computePLReportForDates,
  computeWeekDays,
  priorRangeFor,
  rangeFor,
} from './aggregates'
import {
  appJobCreateToPb,
  appJobEditToPb,
  escapeFilterValue,
  pbClientToApp,
  pbInvoiceToApp,
  pbJobToApp,
  pbJobToAppWithRelations,
  pbPackageToApp,
  type PbRecord,
} from './mappers'
import type {
  Client,
  ClientWithStats,
  DashboardData,
  DashboardKpis,
  Invoice,
  Job,
  JobEditData,
  JobWithRelations,
  Package,
  QuickJobData,
  RecentJobRow,
  WeekDay,
} from '../types'
import type { DateRangeKey } from './reports'
import * as overheadPb from './overhead-pocketbase'
import { getBusinessExpensesMerged } from './business-expenses-merge'
import { businessExpensesTotalForDates } from '../business-expenses-logic'
import { enrichClientWithStats } from '../client-stats'
import { buildDashboardInsights } from '../dashboard-insights'
import { tenantFilter, withOrganization } from './tenant-pocketbase'

const JOB_EXPAND = 'client_id,package_id,invoice_id'

function pb() {
  const client = getPocketBase()
  if (!client || !client.authStore.isValid) {
    throw new Error('PocketBase not authenticated')
  }
  return client
}

async function fetchJobsExpanded(): Promise<JobWithRelations[]> {
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    sort: '-date',
    expand: JOB_EXPAND,
  })
  return records.map(pbJobToAppWithRelations)
}

async function fetchInvoices(): Promise<Invoice[]> {
  const records = await pb().collection('invoices').getFullList<PbRecord>({ sort: '-id' })
  return records.map((r) => normalizeInvoice(pbInvoiceToApp(r)))
}

async function fetchJobsRaw(): Promise<Job[]> {
  const records = await pb().collection('jobs').getFullList<PbRecord>({ sort: '-date' })
  return records.map(pbJobToApp)
}

export async function getPackages(): Promise<Package[]> {
  const records = await pb().collection('packages').getFullList<PbRecord>({
    filter: tenantFilter('active = true'),
    sort: 'name',
  })
  return records.map(pbPackageToApp)
}

export async function getClients(): Promise<Client[]> {
  const records = await pb().collection('clients').getFullList<PbRecord>({ sort: '-id' })
  return records.map(pbClientToApp)
}

export async function getRecentClients(limit: number): Promise<Client[]> {
  const clients = await getClients()
  return clients.slice(0, limit)
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    const record = await pb().collection('clients').getOne<PbRecord>(id)
    return pbClientToApp(record)
  } catch {
    return null
  }
}

export async function getJobs(): Promise<JobWithRelations[]> {
  return fetchJobsExpanded()
}

export async function getJob(id: string): Promise<JobWithRelations | null> {
  try {
    const record = await pb().collection('jobs').getOne<PbRecord>(id, { expand: JOB_EXPAND })
    return pbJobToAppWithRelations(record)
  } catch {
    return null
  }
}

export async function createClient(input: import('../types').ClientInput): Promise<Client> {
  const trimmed = input.name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const payload: Record<string, unknown> = {
    name: trimmed,
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    tags: input.tags ?? [],
    notes: input.notes ?? '',
  }
  const leadSource = toClientLeadSource(input.lead_source)
  if (leadSource) payload.lead_source = leadSource

  try {
    const created = await pb().collection('clients').create<PbRecord>(withOrganization(payload))
    return pbClientToApp(created)
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export async function updateClient(id: string, input: Partial<import('../types').ClientInput>): Promise<Client | null> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.email !== undefined) payload.email = input.email
    if (input.address !== undefined) payload.address = input.address
    if (input.lead_source !== undefined) {
      const leadSource = toClientLeadSource(input.lead_source)
      if (leadSource) payload.lead_source = leadSource
    }
    if (input.tags !== undefined) payload.tags = input.tags
    if (input.notes !== undefined) payload.notes = input.notes

    const record = await pb().collection('clients').update<PbRecord>(id, payload)
    return pbClientToApp(record)
  } catch {
    return null
  }
}

export async function getAllPackages(): Promise<Package[]> {
  const records = await pb().collection('packages').getFullList<PbRecord>({ sort: 'name' })
  return records.map(pbPackageToApp)
}

export async function createPackage(input: import('../types').PackageInput): Promise<Package> {
  const created = await pb().collection('packages').create<PbRecord>(
    withOrganization({
      name: input.name.trim(),
      base_price: input.base_price,
      description: input.description ?? '',
      expected_return_days: input.expected_return_days ?? 90,
      duration_minutes: input.duration_minutes ?? 120,
      default_supplies: input.default_supplies ?? [],
      active: input.active !== false,
    }),
  )
  return pbPackageToApp(created)
}

export async function updatePackage(id: string, input: Partial<import('../types').PackageInput>): Promise<Package | null> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.base_price !== undefined) payload.base_price = input.base_price
    if (input.description !== undefined) payload.description = input.description
    if (input.expected_return_days !== undefined) payload.expected_return_days = input.expected_return_days
    if (input.duration_minutes !== undefined) payload.duration_minutes = input.duration_minutes
    if (input.default_supplies !== undefined) payload.default_supplies = input.default_supplies
    if (input.active !== undefined) payload.active = input.active

    const record = await pb().collection('packages').update<PbRecord>(id, payload)
    return pbPackageToApp(record)
  } catch {
    return null
  }
}

export async function findOrCreateClient(name: string, existingId: string | null): Promise<Client> {
  if (existingId) {
    const existing = await getClient(existingId)
    if (existing) return existing
  }

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const escaped = escapeFilterValue(trimmed)
  const matches = await pb().collection('clients').getFullList<PbRecord>({
    filter: tenantFilter(`name = "${escaped}"`),
    limit: 1,
  })
  if (matches.length > 0) return pbClientToApp(matches[0])

  try {
    const created = await pb().collection('clients').create<PbRecord>(
      withOrganization({ name: trimmed }),
    )
    return pbClientToApp(created)
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export async function createJob(input: QuickJobData): Promise<Job> {
  const client = await findOrCreateClient(input.clientName, input.clientId)
  const payload = appJobCreateToPb({
    date: input.date,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: client.id,
    status: defaultQuickJobStatus(input.date),
    revenue: input.revenue,
    tip: input.tip,
    start_time: input.start_time,
    notes: input.notes,
    travel_cost: input.travel_cost,
    marketing_cost: input.marketing_cost,
    equipment_depreciation: input.equipment_depreciation,
    recurrence_cadence: input.recurrence_cadence,
    recurrence_anchor_date: input.recurrence_cadence
      ? input.recurrence_anchor_date ?? input.date
      : undefined,
  }) as Record<string, unknown>

  const { getSupplies, deductSupplies } = await import('./supplies-pocketbase')
  const [catalog, pkgRecord] = await Promise.all([
    getSupplies(),
    pb().collection('packages').getOne<PbRecord>(input.packageId),
  ])
  const pkg = pbPackageToApp(pkgRecord)
  const suppliesUsed = resolveSuppliesUsed({ supplies_used: [] }, pkg, input.supplies_used)
  const { supplies_used, expenses } = applySupplyExpenses(suppliesUsed, catalog)
  payload.supplies_used = supplies_used
  payload.expenses = expenses

  try {
    const record = await pb().collection('jobs').create<PbRecord>(withOrganization(payload))
    if (supplies_used.length > 0) {
      await deductSupplies(suppliesUsed)
    }
    return pbJobToApp(record)
  } catch (err) {
    rethrowPremiumPocketBaseError(err)
  }
}

export async function updateJob(id: string, updates: JobEditData): Promise<Job | null> {
  try {
    const current = await pb().collection('jobs').getOne<PbRecord>(id, { expand: 'package_id' })
    const currentJob = pbJobToApp(current)
    const pkg = current.expand?.package_id ? pbPackageToApp(current.expand.package_id) : undefined
    const completing = isCompletingJob(currentJob.status, updates.status)
    const alreadyCompleted = isCompletedStatus(currentJob.status)

    const payload = appJobEditToPb(updates) as Record<string, unknown>

    if (completing || (alreadyCompleted && updates.supplies_used !== undefined)) {
      const { getSupplies, deductSupplies } = await import('./supplies-pocketbase')
      const catalog = await getSupplies()
      const suppliesUsed = resolveSuppliesUsed(currentJob, pkg, updates.supplies_used)

      if (completing) {
        const { supplies_used, expenses } = applySupplyExpenses(suppliesUsed, catalog, currentJob.expenses)
        payload.supplies_used = supplies_used
        payload.expenses = expenses
        await deductSupplies(suppliesUsed)
      } else {
        const { supplies_used, expenses } = applySupplyExpenses(suppliesUsed, catalog, currentJob.expenses)
        payload.supplies_used = supplies_used
        payload.expenses = expenses
        const delta = inventoryDeltaFromUsageChange(currentJob.supplies_used, suppliesUsed)
        if (delta.length > 0) await deductSupplies(delta)
      }
    }

    const record = await pb().collection('jobs').update<PbRecord>(id, payload)
    return pbJobToApp(record)
  } catch {
    return null
  }
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  const [clients, jobs, packages] = await Promise.all([
    getClients(),
    fetchJobsRaw(),
    getPackages(),
  ])
  return clients.map((client) => {
    const clientJobs = jobs.filter((j) => j.client_id === client.id)
    return enrichClientWithStats(client, clientJobs, packages)
  })
}

export async function getClientJobs(clientId: string): Promise<JobWithRelations[]> {
  const escaped = escapeFilterValue(clientId)
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    filter: tenantFilter(`client_id = "${escaped}"`),
    sort: '-date',
    expand: JOB_EXPAND,
  })
  return records.map(pbJobToAppWithRelations)
}

export async function getDashboardData(): Promise<DashboardData> {
  const [jobs, invoices, overheadItems, businessItems] = await Promise.all([
    fetchJobsExpanded(),
    fetchInvoices(),
    overheadPb.getOverheadExpenses(),
    getBusinessExpensesMerged(),
  ])
  const { start, end } = rangeFor('this_month')
  const mtdOverhead = overheadAmountForDates(overheadItems, start, end)
  const mtdBusiness = businessExpensesTotalForDates(businessItems, start, end)
  const base = computeDashboard(jobs, invoices, mtdOverhead, mtdBusiness)
  return {
    ...base,
    insights: buildDashboardInsights(jobs, invoices, base.kpis, base.priorRevenueMtd),
  }
}

export async function getWeekDays(): Promise<WeekDay[]> {
  const jobs = await fetchJobsRaw()
  return computeWeekDays(jobs)
}

export async function getJobsForDate(date: string): Promise<RecentJobRow[]> {
  const escaped = escapeFilterValue(date)
  const records = await pb().collection('jobs').getFullList<PbRecord>({
    filter: tenantFilter(`date = "${escaped}"`),
    expand: JOB_EXPAND,
  })
  return computeJobsForDate(records.map(pbJobToAppWithRelations), date)
}

export async function getPLReport(range: DateRangeKey) {
  const { start, end } = rangeFor(range)
  const [jobs, overhead, businessItems] = await Promise.all([
    fetchJobsRaw(),
    overheadPb.getOverheadForRange(range),
    getBusinessExpensesMerged(),
  ])
  const business = businessExpensesTotalForDates(businessItems, start, end)
  return computePLReport(jobs, range, overhead, business)
}

export async function getPLReportBundle(range: DateRangeKey) {
  const [jobs, overheadItems, businessItems] = await Promise.all([
    fetchJobsRaw(),
    overheadPb.getOverheadExpenses(),
    getBusinessExpensesMerged(),
  ])
  const { start, end } = rangeFor(range)
  const prior = priorRangeFor(range)
  const currentOverhead = overheadAmountForDates(overheadItems, start, end)
  const priorOverhead = overheadAmountForDates(overheadItems, prior.start, prior.end)
  const currentBusiness = businessExpensesTotalForDates(businessItems, start, end)
  const priorBusiness = businessExpensesTotalForDates(businessItems, prior.start, prior.end)
  return {
    current: computePLReportForDates(jobs, start, end, currentOverhead, currentBusiness),
    prior: computePLReportForDates(jobs, prior.start, prior.end, priorOverhead, priorBusiness),
  }
}

export async function exportJobsCSV(range: DateRangeKey): Promise<string> {
  const [jobs, clients, packages] = await Promise.all([
    fetchJobsRaw(),
    getClients(),
    getPackages(),
  ])
  return computeJobsCSV(jobs, range, (job) => ({
    client: clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: packages.find((p) => p.id === job.package_id)?.name ?? '',
  }), {
    periodLabel: rangePeriodLabel(range),
    periodRange: rangeDateSpanLabel(range),
    businessName: loadSettings().business_name,
  })
}

const DEFAULT_PACKAGES = [
  { name: 'Basic Wash', base_price: 80, active: true, description: 'Exterior wash and dry' },
  { name: 'Full Detail', base_price: 320, active: true, description: 'Interior + exterior full detail' },
  { name: 'Paint Correction', base_price: 450, active: true, description: 'Single-stage paint correction' },
  { name: 'Ceramic Coat', base_price: 800, active: true, description: 'Ceramic coating application' },
]

/** Ensure default service packages exist — only when collection is empty and auth works. */
export async function seedPackagesIfEmpty(): Promise<number> {
  if (!(await ensurePocketBaseAuth())) return 0

  const client = pb()
  const { totalItems } = await client.collection('packages').getList(1, 1, {
    filter: tenantFilter(),
  })
  if (totalItems > 0) return 0

  let created = 0
  for (const pkg of DEFAULT_PACKAGES) {
    try {
      await client.collection('packages').create(withOrganization(pkg))
      created++
    } catch {
      // Unauthenticated or validation failure — stop rather than spam the console
      break
    }
  }
  return created
}

export async function getCollectionCounts(): Promise<Record<string, number>> {
  const collections = ['packages', 'clients', 'jobs', 'invoices'] as const
  const counts: Record<string, number> = {}
  for (const name of collections) {
    const list = await pb().collection(name).getList(1, 1)
    counts[name] = list.totalItems
  }
  return counts
}

export type DeleteJobResult = { ok: boolean; error?: string }
export type DeleteClientResult = { ok: boolean; error?: string }

async function deleteRecordsByFieldFilter(collection: string, field: string, value: string): Promise<void> {
  const escaped = escapeFilterValue(value)
  try {
    const records = await pb().collection(collection).getFullList<PbRecord>({
      filter: tenantFilter(`${field} = "${escaped}"`),
    })
    for (const record of records) {
      await pb().collection(collection).delete(record.id)
    }
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0
    if (status === 404) return
    throw err
  }
}

async function deleteRecordsByJobFilter(collection: string, jobId: string): Promise<void> {
  return deleteRecordsByFieldFilter(collection, 'job_id', jobId)
}

async function clearQuoteJobLinks(jobId: string): Promise<void> {
  const escaped = escapeFilterValue(jobId)
  try {
    const quotes = await pb().collection('quotes').getFullList<PbRecord>({
      filter: tenantFilter(`job_id = "${escaped}"`),
    })
    for (const quote of quotes) {
      try {
        await pb().collection('quotes').update(quote.id, { job_id: '' })
      } catch {
        await pb().collection('quotes').update(quote.id, { job_id: null })
      }
    }
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0
    if (status === 404) return
    throw err
  }
}

export async function deleteJob(id: string): Promise<DeleteJobResult> {
  if (!(await ensurePocketBaseAuth())) {
    return { ok: false, error: 'Could not authenticate with PocketBase' }
  }

  try {
    const job = await pb().collection('jobs').getOne<PbRecord>(id)

    await deleteRecordsByJobFilter('invoices', id)

    const invoiceId = job.invoice_id
    if (typeof invoiceId === 'string' && invoiceId) {
      try {
        await pb().collection('invoices').delete(invoiceId)
      } catch {
        // already removed
      }
    }

    await clearQuoteJobLinks(id)
    await deleteRecordsByJobFilter('damage_docs', id)
    await deleteRecordsByJobFilter('portal_tokens', id)

    await pb().collection('jobs').delete(id)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete job'
    return { ok: false, error: message }
  }
}

export async function deleteClient(id: string): Promise<DeleteClientResult> {
  if (!(await ensurePocketBaseAuth())) {
    return { ok: false, error: 'Could not authenticate with PocketBase' }
  }

  try {
    const escaped = escapeFilterValue(id)
    const jobs = await pb().collection('jobs').getFullList<PbRecord>({
      filter: tenantFilter(`client_id = "${escaped}"`),
    })
    for (const job of jobs) {
      const result = await deleteJob(job.id)
      if (!result.ok) {
        return { ok: false, error: result.error ?? 'Failed to delete a job for this client' }
      }
    }

    await deleteRecordsByFieldFilter('quotes', 'client_id', id)

    const vehicles = await pb().collection('vehicles').getFullList<PbRecord>({
      filter: tenantFilter(`client_id = "${escaped}"`),
    })
    for (const vehicle of vehicles) {
      await deleteRecordsByFieldFilter('damage_docs', 'vehicle_id', vehicle.id)
      await pb().collection('vehicles').delete(vehicle.id)
    }

    await deleteRecordsByFieldFilter('portal_tokens', 'client_id', id)
    await deleteRecordsByFieldFilter('invoices', 'client_id', id)

    await pb().collection('clients').delete(id)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete client'
    return { ok: false, error: message }
  }
}
