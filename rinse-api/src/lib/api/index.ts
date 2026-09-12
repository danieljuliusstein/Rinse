import { clearLocalDeviceDataSync, purgeDemoCacheIfPresent } from '../clear-local-data'
import { purgeStaleQueueItems } from './queue-utils'
import { ensurePocketBaseAuth } from '../pb-auth'
import { syncCatalogReadyFlag } from './catalog-ready'
import { checkPocketBaseHealth, checkPocketBaseSchema, isPocketBaseConfigured } from '../pocketbase'
import { withTimeout } from '../timeout'
import { migrateLocalToPocketBase } from './migrate'
import * as invLocal from './invoices-local'
import * as invPb from './invoices-pocketbase'
import * as quotesLocal from './quotes-local'
import * as quotesPb from './quotes-pocketbase'
import * as leadsLocal from './leads-local'
import * as leadsPb from './leads-pocketbase'
import * as timeBlocksPb from './time-blocks-pocketbase'
import * as local from './local'
import * as overheadLocal from './overhead-local'
import * as overheadPb from './overhead-pocketbase'
import * as businessExpensesLocal from './business-expenses-local'
import * as businessExpensesPb from './business-expenses-pocketbase'
import * as supplyPurchasesLocal from './supply-purchases-local'
import * as supplyPurchasesPb from './supply-purchases-pocketbase'
import * as photosLocal from './photos-local'
import * as photosPb from './photos-pocketbase'
import * as vehiclesLocal from './vehicles-local'
import * as vehiclesPb from './vehicles-pocketbase'
import * as damageLocal from './damage-docs-local'
import * as damagePb from './damage-docs-pocketbase'
import * as lineTemplatesLocal from './line-templates-local'
import * as lineTemplatesPb from './line-templates-pocketbase'
import * as pb from './pocketbase'
import { clearQueue } from '../offline-queue'
import {
  flushOfflineQueue,
  getMigrationStatus,
  getSyncStatus,
  runDataMigration,
  syncOnReconnect,
  type FlushResult,
  type MigrationResult,
  type MigrationStatus,
  type SyncStatus,
} from './sync'
import * as equipmentLocal from './equipment-local'
import * as equipmentPb from './equipment-pocketbase'
import * as suppliesLocal from './supplies-local'
import * as suppliesPb from './supplies-pocketbase'
import { compressJobPhoto } from '../compress-job-photo'
import { compressInventoryPhoto } from '../compress-inventory-photo'
import { notifyFinancialDataChanged } from '../financial-data-events'
import {
  applyInventoryIconOverride,
  mergeInventoryIconKeys,
  persistInventoryIconKey,
} from '../inventory-icon-overlay'
import { getBusinessExpensesMerged } from './business-expenses-merge'
import { clearWriteDegraded, executeWrite } from './write-router'
import { assertCanWrite } from '../write-guard'
import {
  getPLReportFromJobs,
  getPLReportBundleFromJobs,
  exportJobsCSVFromJobs,
  type DateRangeKey,
  type PLReportBundle,
} from './reports'
import type {
  Client,
  ClientInput,
  ClientWithStats,
  DamageRecord,
  DamageRecordInput,
  DashboardData,
  DashboardKpis,
  Invoice,
  Job,
  JobEditData,
  JobPhoto,
  JobWithRelations,
  BusinessExpense,
  BusinessExpenseInput,
  OverheadExpense,
  OverheadInput,
  Package,
  PackageInput,
  Payment,
  PhotoType,
  Quote,
  QuoteInput,
  QuoteWithRelations,
  Lead,
  LeadInput,
  LeadStage,
  LeadWithRelations,
  Equipment,
  EquipmentInput,
  QuickJobData,
  RecentJobRow,
  RestockInput,
  Supply,
  SupplyInput,
  SupplyPurchaseInput,
  Vehicle,
  VehicleInput,
  WeekDay,
} from '../types'

export type { DateRangeKey, PLReport } from './reports'
export type { FlushResult, MigrationResult, MigrationStatus, SyncStatus }
export { getMigrationStatus, getSyncStatus, runDataMigration, flushOfflineQueue, syncOnReconnect }
export { clearLocalDeviceDataSync as clearLocalDeviceData, purgeDemoCacheIfPresent }

let backend: 'local' | 'pocketbase' | null = null
let initPromise: Promise<'local' | 'pocketbase'> | null = null

async function resolveBackend(): Promise<'local' | 'pocketbase'> {
  if (backend) return backend

  if (!initPromise) {
    initPromise = initBackend()
  }
  return initPromise
}

async function initBackendInner(): Promise<'local' | 'pocketbase'> {
  purgeDemoCacheIfPresent()
  await purgeStaleQueueItems()

  if (!isPocketBaseConfigured()) {
    return 'local'
  }

  const healthy = await checkPocketBaseHealth()
  if (!healthy) {
    return 'local'
  }

  if (!(await ensurePocketBaseAuth())) {
    return 'local'
  }

  const schema = await checkPocketBaseSchema()
  if (!schema.ok) {
    console.warn('[api] PocketBase collections missing — run: cd pocketbase && ./pocketbase migrate up', schema.error)
    return 'local'
  }

  clearWriteDegraded()
  purgeDemoCacheIfPresent()
  const { loadSettingsAsync } = await import('../settings')
  await loadSettingsAsync()

  // Non-blocking — keeps mobile connect fast on slow networks
  void (async () => {
    try {
      await syncCatalogReadyFlag()
    } catch {
      // catalog check is best-effort on connect
    }
    try {
      await migrateLocalToPocketBase()
    } catch (err) {
      console.warn('[api] Local data migration failed:', err)
    }
    try {
      await flushOfflineQueue()
    } catch (err) {
      console.warn('[api] Offline queue flush failed:', err)
    }
  })()

  return 'pocketbase'
}

async function initBackend(): Promise<'local' | 'pocketbase'> {
  try {
    backend = await withTimeout(initBackendInner(), 25_000, 'Backend init')
  } catch (err) {
    console.warn('[api] PocketBase init failed, using local storage:', err)
    backend = 'local'
  }
  return backend
}

/** Force re-resolve on next request (e.g. after reconnect) */
export function resetBackend(): void {
  backend = null
  initPromise = null
}

export async function getPackages(): Promise<Package[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getPackages() : local.getPackages()
}

export async function getAllPackages(): Promise<Package[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getAllPackages() : local.getAllPackages()
}

export async function createPackage(input: PackageInput): Promise<Package> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? pb.createPackage(input) : local.createPackage(input)
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? pb.updatePackage(id, input) : local.updatePackage(id, input)
}

export async function getClients(): Promise<Client[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClients() : local.getClients()
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClientsWithStats() : local.getClientsWithStats()
}

export async function getClient(id: string): Promise<Client | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClient(id) : local.getClient(id)
}

export async function createClient(input: ClientInput): Promise<Client> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? pb.createClient(input) : local.createClient(input)
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? pb.updateClient(id, input) : local.updateClient(id, input)
}

export async function deleteClient(id: string): Promise<{ ok: boolean; error?: string }> {
  const [jobs, vehicles] = await Promise.all([getClientJobs(id), getVehiclesForClient(id)])
  const jobIds = jobs.map((j) => j.id)
  const vehicleIds = vehicles.map((v) => v.id)

  const resolved = await resolveBackend()
  const result = await executeWrite({
    resolvedBackend: resolved,
    local: () => ({ ok: local.deleteClient(id) }),
    pocketbase: () => pb.deleteClient(id),
    buildQueue: (r) => (r.ok ? { type: 'deleteClient', params: { id } } : null),
  })
  if (result.ok) {
    const { purgeQueueItemsForClient, purgeQueueItemsForJob } = await import('./queue-utils')
    for (const jobId of jobIds) {
      await purgeQueueItemsForJob(jobId)
    }
    await purgeQueueItemsForClient(id, jobIds, vehicleIds)
    notifyFinancialDataChanged()
  }
  return result
}

export async function getClientJobs(clientId: string): Promise<JobWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getClientJobs(clientId) : local.getClientJobs(clientId)
}

export async function getRecentClients(limit = 10): Promise<Client[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getRecentClients(limit) : local.getRecentClients(limit)
}

export async function getJobs(): Promise<JobWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJobs() : local.getJobs()
}

export async function getJob(id: string): Promise<JobWithRelations | null> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJob(id) : local.getJob(id)
}

export async function createJob(data: QuickJobData): Promise<Job> {
  const resolved = await resolveBackend()
  const job = await executeWrite({
    resolvedBackend: resolved,
    local: () => local.createJob(data),
    pocketbase: () => pb.createJob(data),
    buildQueue: (job) => ({ type: 'createJob', params: data, localJobId: job.id }),
  })
  notifyFinancialDataChanged()
  return job
}

export async function updateJob(id: string, data: JobEditData): Promise<Job | null> {
  const resolved = await resolveBackend()
  const job = await executeWrite({
    resolvedBackend: resolved,
    local: () => local.updateJob(id, data),
    pocketbase: () => pb.updateJob(id, data),
    buildQueue: (job) => (job ? { type: 'updateJob', params: { id, data } } : null),
  })
  notifyFinancialDataChanged()
  return job
}

export async function deleteJob(id: string): Promise<{ ok: boolean; error?: string }> {
  const resolved = await resolveBackend()
  const result = await executeWrite({
    resolvedBackend: resolved,
    local: () => ({ ok: local.deleteJob(id) }),
    pocketbase: () => pb.deleteJob(id),
    buildQueue: (r) => (r.ok ? { type: 'deleteJob', params: { id } } : null),
  })
  if (result.ok) {
    const { purgeQueueItemsForJob } = await import('./queue-utils')
    await purgeQueueItemsForJob(id)
    notifyFinancialDataChanged()
  }
  return result
}

export async function getDashboardData(): Promise<DashboardData & { weekDays: WeekDay[] }> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') {
    const [base, weekDays] = await Promise.all([pb.getDashboardData(), pb.getWeekDays()])
    return { ...base, weekDays }
  }
  return { ...local.getDashboardData(), weekDays: local.getWeekDays() }
}

export async function getJobsForDate(date: string): Promise<RecentJobRow[]> {
  return (await resolveBackend()) === 'pocketbase' ? pb.getJobsForDate(date) : local.getJobsForDate(date)
}

export async function findOrCreateClient(name: string, existingId: string | null): Promise<Client> {
  return (await resolveBackend()) === 'pocketbase'
    ? pb.findOrCreateClient(name, existingId)
    : local.findOrCreateClient(name, existingId)
}

export async function getPLReport(range: DateRangeKey) {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.getPLReport(range)
  return getPLReportFromJobs(local.getJobsRaw(), range)
}

export async function getPLReportBundle(range: DateRangeKey): Promise<PLReportBundle> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.getPLReportBundle(range)
  return getPLReportBundleFromJobs(local.getJobsRaw(), range)
}

export async function exportJobsCSV(range: DateRangeKey): Promise<string> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') return pb.exportJobsCSV(range)
  return exportJobsCSVFromJobs(local.getJobsRaw(), range)
}

export async function getActiveBackend(): Promise<'local' | 'pocketbase'> {
  return resolveBackend()
}

export async function createInvoiceForJob(jobId: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.createInvoiceForJob(jobId),
    pocketbase: () => invPb.createInvoiceForJob(jobId),
    buildQueue: (invoice) => ({ type: 'createInvoiceForJob', params: { jobId } }),
  })
}

export async function getInvoices(): Promise<Invoice[]> {
  return (await resolveBackend()) === 'pocketbase' ? invPb.getInvoices() : invLocal.getInvoices()
}

export async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  return (await resolveBackend()) === 'pocketbase'
    ? invPb.getInvoiceByJobId(jobId)
    : invLocal.getInvoiceByJobId(jobId)
}

export async function clearOfflineQueue(): Promise<void> {
  await clearQueue()
}

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.markInvoiceSent(invoiceId),
    pocketbase: () => invPb.markInvoiceSent(invoiceId),
    buildQueue: () => ({ type: 'markInvoiceSent', params: { invoiceId } }),
  })
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.addPayment(invoiceId, payment),
    pocketbase: () => invPb.addPayment(invoiceId, payment),
    buildQueue: () => ({ type: 'addPayment', params: { invoiceId, payment } }),
  })
}

export async function markInvoicePaid(invoiceId: string, method: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.markInvoicePaid(invoiceId, method),
    pocketbase: () => invPb.markInvoicePaid(invoiceId, method),
    buildQueue: () => ({ type: 'markInvoicePaid', params: { invoiceId, method } }),
  })
}

export async function updateInvoice(
  invoiceId: string,
  patch: invLocal.InvoiceUpdate
): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.updateInvoice(invoiceId, patch),
    pocketbase: () => invPb.updateInvoice(invoiceId, patch),
    buildQueue: () => ({ type: 'updateInvoice', params: { invoiceId, patch } }),
  })
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => {
      invLocal.deleteInvoice(invoiceId)
    },
    pocketbase: () => invPb.deleteInvoice(invoiceId),
    buildQueue: () => ({ type: 'deleteInvoice', params: { invoiceId } }),
  })
}

export async function duplicateInvoice(invoiceId: string): Promise<Invoice> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => invLocal.duplicateInvoice(invoiceId),
    pocketbase: () => invPb.duplicateInvoice(invoiceId),
    buildQueue: () => ({ type: 'duplicateInvoice', params: { invoiceId } }),
  })
}

export async function getQuotes(): Promise<QuoteWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? quotesPb.getQuotes() : quotesLocal.getQuotes()
}

export async function getQuote(id: string): Promise<QuoteWithRelations | null> {
  return (await resolveBackend()) === 'pocketbase' ? quotesPb.getQuote(id) : quotesLocal.getQuote(id)
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? quotesPb.createQuote(input)
    : quotesLocal.createQuote(input)
}

export async function markQuoteSent(quoteId: string): Promise<Quote | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? quotesPb.updateQuoteStatus(quoteId, 'sent')
    : quotesLocal.updateQuoteStatus(quoteId, 'sent')
}

export async function acceptQuote(quoteId: string): Promise<{ quote: Quote; jobId: string } | null> {
  assertCanWrite()
  const result =
    (await resolveBackend()) === 'pocketbase'
      ? await quotesPb.acceptQuote(quoteId)
      : quotesLocal.acceptQuote(quoteId)
  if (result) notifyFinancialDataChanged()
  return result
}

export async function declineQuote(quoteId: string): Promise<Quote | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? quotesPb.updateQuoteStatus(quoteId, 'declined')
    : quotesLocal.updateQuoteStatus(quoteId, 'declined')
}

export async function getLeads(): Promise<LeadWithRelations[]> {
  return (await resolveBackend()) === 'pocketbase' ? leadsPb.getLeads() : leadsLocal.getLeads()
}

export async function getLead(id: string): Promise<LeadWithRelations | null> {
  return (await resolveBackend()) === 'pocketbase' ? leadsPb.getLead(id) : leadsLocal.getLead(id)
}

export async function createLead(input: LeadInput): Promise<Lead> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? leadsPb.createLead(input) : leadsLocal.createLead(input)
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<Lead | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? leadsPb.updateLead(id, input) : leadsLocal.updateLead(id, input)
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<Lead | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? leadsPb.updateLeadStage(id, stage)
    : leadsLocal.updateLeadStage(id, stage)
}

export async function deleteLead(id: string): Promise<boolean> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase' ? leadsPb.deleteLead(id) : leadsLocal.deleteLead(id)
}

export async function getTimeBlocks(fromDate: string, toDate: string) {
  if ((await resolveBackend()) !== 'pocketbase') return []
  return timeBlocksPb.getTimeBlocks(fromDate, toDate)
}

export async function createTimeBlock(input: import('../types').TimeBlockInput) {
  assertCanWrite()
  if ((await resolveBackend()) !== 'pocketbase') {
    throw new Error('Time blocks require PocketBase')
  }
  return timeBlocksPb.createTimeBlock(input)
}

export async function deleteTimeBlock(id: string) {
  assertCanWrite()
  if ((await resolveBackend()) !== 'pocketbase') return false
  return timeBlocksPb.deleteTimeBlock(id)
}

export async function createQuoteForLead(leadId: string): Promise<Quote> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? leadsPb.createQuoteForLead(leadId)
    : leadsLocal.createQuoteForLead(leadId)
}

export async function convertLeadToJob(
  leadId: string,
  options?: import('./leads-pocketbase').ConvertLeadToJobOptions
): Promise<{ jobId: string; clientId: string }> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? leadsPb.convertLeadToJob(leadId, options)
    : leadsLocal.convertLeadToJob(leadId, options)
}

export async function getSupplies(): Promise<Supply[]> {
  const supplies =
    (await resolveBackend()) === 'pocketbase'
      ? await suppliesPb.getSupplies()
      : suppliesLocal.getSupplies()
  return mergeInventoryIconKeys(supplies)
}

export async function getSupply(id: string): Promise<Supply | null> {
  const supply =
    (await resolveBackend()) === 'pocketbase'
      ? await suppliesPb.getSupply(id)
      : suppliesLocal.getSupply(id)
  return applyInventoryIconOverride(supply)
}

export async function getLowInventorySupplies(): Promise<Supply[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? suppliesPb.getLowInventorySupplies()
    : suppliesLocal.getLowInventorySupplies()
}

export async function createSupply(input: SupplyInput): Promise<Supply> {
  const resolved = await resolveBackend()
  const created = await executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.createSupply(input),
    pocketbase: () => suppliesPb.createSupply(input),
    buildQueue: (supply) => ({ type: 'createSupply', params: input, localSupplyId: supply.id }),
  })
  if (input.icon_key) persistInventoryIconKey(created.id, input.icon_key)
  return applyInventoryIconOverride(created) ?? created
}

export async function updateSupply(id: string, input: Partial<SupplyInput>): Promise<Supply | null> {
  if (input.icon_key !== undefined) persistInventoryIconKey(id, input.icon_key || undefined)
  const resolved = await resolveBackend()
  const updated = await executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.updateSupply(id, input),
    pocketbase: () => suppliesPb.updateSupply(id, input),
    buildQueue: (supply) => (supply ? { type: 'updateSupply', params: { id, input } } : null),
  })
  return applyInventoryIconOverride(updated)
}

export async function uploadSupplyPhoto(id: string, file: File): Promise<Supply | null> {
  const prepared = await compressInventoryPhoto(file)
  const resolved = await resolveBackend()
  const dataUrlPromise = readFileAsDataUrl(prepared)
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.uploadSupplyPhoto(id, prepared),
    pocketbase: () => suppliesPb.uploadSupplyPhoto(id, prepared),
    buildQueue: async (supply) =>
      supply
        ? {
            type: 'uploadSupplyPhoto',
            params: { id, dataUrl: await dataUrlPromise, filename: prepared.name },
          }
        : null,
  })
}

export async function clearSupplyPhoto(id: string): Promise<Supply | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.clearSupplyPhoto(id),
    pocketbase: () => suppliesPb.clearSupplyPhoto(id),
    buildQueue: (supply) =>
      supply ? { type: 'clearSupplyPhoto', params: { id } } : null,
  })
}

export async function deleteSupply(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') {
    try {
      return await suppliesPb.deleteSupply(id)
    } catch {
      return suppliesLocal.deleteSupply(id)
    }
  }
  return suppliesLocal.deleteSupply(id)
}

export async function restockSupply(id: string, input: RestockInput): Promise<Supply | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => suppliesLocal.restockSupply(id, input),
    pocketbase: () => suppliesPb.restockSupply(id, input),
    buildQueue: (supply) => (supply ? { type: 'restockSupply', params: { id, input } } : null),
  })
}

export async function getEquipment(): Promise<Equipment[]> {
  const items =
    (await resolveBackend()) === 'pocketbase'
      ? await equipmentPb.getEquipment()
      : equipmentLocal.getEquipment()
  return mergeInventoryIconKeys(items)
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const resolved = await resolveBackend()
  const created = await executeWrite({
    resolvedBackend: resolved,
    local: () => equipmentLocal.createEquipment(input),
    pocketbase: () => equipmentPb.createEquipment(input),
    buildQueue: (item) => ({ type: 'createEquipment', params: input, localEquipmentId: item.id }),
  })
  if (input.icon_key) persistInventoryIconKey(created.id, input.icon_key)
  return applyInventoryIconOverride(created) ?? created
}

export async function updateEquipment(
  id: string,
  input: Partial<EquipmentInput>
): Promise<Equipment | null> {
  if (input.icon_key !== undefined) persistInventoryIconKey(id, input.icon_key || undefined)
  const resolved = await resolveBackend()
  const updated = await executeWrite({
    resolvedBackend: resolved,
    local: () => equipmentLocal.updateEquipment(id, input),
    pocketbase: () => equipmentPb.updateEquipment(id, input),
    buildQueue: (item) => (item ? { type: 'updateEquipment', params: { id, input } } : null),
  })
  return applyInventoryIconOverride(updated)
}

export async function uploadEquipmentPhoto(id: string, file: File): Promise<Equipment | null> {
  const prepared = await compressInventoryPhoto(file)
  const resolved = await resolveBackend()
  const dataUrlPromise = readFileAsDataUrl(prepared)
  return executeWrite({
    resolvedBackend: resolved,
    local: () => equipmentLocal.uploadEquipmentPhoto(id, prepared),
    pocketbase: () => equipmentPb.uploadEquipmentPhoto(id, prepared),
    buildQueue: async (item) =>
      item
        ? {
            type: 'uploadEquipmentPhoto',
            params: { id, dataUrl: await dataUrlPromise, filename: prepared.name },
          }
        : null,
  })
}

export async function clearEquipmentPhoto(id: string): Promise<Equipment | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => equipmentLocal.clearEquipmentPhoto(id),
    pocketbase: () => equipmentPb.clearEquipmentPhoto(id),
    buildQueue: (item) =>
      item ? { type: 'clearEquipmentPhoto', params: { id } } : null,
  })
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  if (resolved === 'pocketbase') {
    try {
      return await equipmentPb.deleteEquipment(id)
    } catch {
      return equipmentLocal.deleteEquipment(id)
    }
  }
  return equipmentLocal.deleteEquipment(id)
}

export async function getOverheadExpenses(): Promise<OverheadExpense[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? overheadPb.getOverheadExpenses()
    : overheadLocal.getOverheadExpenses()
}

export async function createOverheadExpense(input: OverheadInput): Promise<OverheadExpense> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.createOverheadExpense(input),
    pocketbase: () => overheadPb.createOverheadExpense(input),
    buildQueue: (expense) => ({ type: 'createOverheadExpense', params: input, localOverheadId: expense.id }),
  })
  notifyFinancialDataChanged()
  return expense
}

export async function updateOverheadExpense(
  id: string,
  input: Partial<OverheadInput>
): Promise<OverheadExpense | null> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.updateOverheadExpense(id, input),
    pocketbase: () => overheadPb.updateOverheadExpense(id, input),
    buildQueue: (expense) => (expense ? { type: 'updateOverheadExpense', params: { id, input } } : null),
  })
  notifyFinancialDataChanged()
  return expense
}

export async function deleteOverheadExpense(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  const ok = await executeWrite({
    resolvedBackend: resolved,
    local: () => overheadLocal.deleteOverheadExpense(id),
    pocketbase: () => overheadPb.deleteOverheadExpense(id),
    buildQueue: () => ({ type: 'deleteOverheadExpense', params: { id } }),
  })
  notifyFinancialDataChanged()
  return ok
}

export async function getMonthlyOverheadTotal(): Promise<number> {
  return (await resolveBackend()) === 'pocketbase'
    ? overheadPb.getMonthlyOverheadTotal()
    : overheadLocal.getMonthlyOverheadTotal()
}

export async function getBusinessExpenses(): Promise<BusinessExpense[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? getBusinessExpensesMerged()
    : businessExpensesLocal.getBusinessExpenses()
}

export async function createBusinessExpense(input: BusinessExpenseInput): Promise<BusinessExpense> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => businessExpensesLocal.createBusinessExpense(input),
    pocketbase: () => businessExpensesPb.createBusinessExpense(input),
    buildQueue: (expense) => ({
      type: 'createBusinessExpense',
      params: input,
      localBusinessExpenseId: expense.id,
      localEquipmentId: input.equipment_id,
    }),
  })
  notifyFinancialDataChanged()
  return expense
}

export async function updateBusinessExpense(
  id: string,
  input: Partial<BusinessExpenseInput>
): Promise<BusinessExpense | null> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => businessExpensesLocal.updateBusinessExpense(id, input),
    pocketbase: () => businessExpensesPb.updateBusinessExpense(id, input),
    buildQueue: (expense) =>
      expense ? { type: 'updateBusinessExpense', params: { id, input } } : null,
  })
  notifyFinancialDataChanged()
  return expense
}

export async function deleteBusinessExpense(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  const ok = await executeWrite({
    resolvedBackend: resolved,
    local: () => businessExpensesLocal.deleteBusinessExpense(id),
    pocketbase: () => businessExpensesPb.deleteBusinessExpense(id),
    buildQueue: () => ({ type: 'deleteBusinessExpense', params: { id } }),
  })
  notifyFinancialDataChanged()
  return ok
}

export async function createSupplyPurchase(input: SupplyPurchaseInput): Promise<BusinessExpense> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => supplyPurchasesLocal.createSupplyPurchase(input),
    pocketbase: () => supplyPurchasesPb.createSupplyPurchase(input),
    buildQueue: (expense) => ({
      type: 'createSupplyPurchase',
      params: input,
      localBusinessExpenseId: expense.id,
      localSupplyId: expense.supply_id,
    }),
  })
  notifyFinancialDataChanged()
  return expense
}

export async function updateSupplyPurchase(
  id: string,
  input: Partial<SupplyPurchaseInput>
): Promise<BusinessExpense | null> {
  const resolved = await resolveBackend()
  const expense = await executeWrite({
    resolvedBackend: resolved,
    local: () => supplyPurchasesLocal.updateSupplyPurchase(id, input),
    pocketbase: () => supplyPurchasesPb.updateSupplyPurchase(id, input),
    buildQueue: (expense) =>
      expense ? { type: 'updateSupplyPurchase', params: { id, input } } : null,
  })
  notifyFinancialDataChanged()
  return expense
}

export async function deleteSupplyPurchase(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  const ok = await executeWrite({
    resolvedBackend: resolved,
    local: () => supplyPurchasesLocal.deleteSupplyPurchase(id),
    pocketbase: () => supplyPurchasesPb.deleteSupplyPurchase(id),
    buildQueue: () => ({ type: 'deleteSupplyPurchase', params: { id } }),
  })
  notifyFinancialDataChanged()
  return ok
}

export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? photosPb.getJobPhotos(jobId)
    : photosLocal.getJobPhotos(jobId)
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadJobPhoto(jobId: string, file: File, type: PhotoType): Promise<JobPhoto> {
  const prepared = await compressJobPhoto(file)
  const resolved = await resolveBackend()
  const dataUrlPromise = readFileAsDataUrl(prepared)
  return executeWrite({
    resolvedBackend: resolved,
    local: () => photosLocal.uploadJobPhoto(jobId, prepared, type),
    pocketbase: () => photosPb.uploadJobPhoto(jobId, prepared, type),
    buildQueue: async (photo) => ({
      type: 'uploadJobPhoto',
      params: {
        jobId,
        dataUrl: await dataUrlPromise,
        photoType: type,
        filename: photo.filename,
      },
    }),
  })
}

export async function deleteJobPhoto(jobId: string, filename: string): Promise<void> {
  const resolved = await resolveBackend()
  await executeWrite({
    resolvedBackend: resolved,
    local: () => { photosLocal.deleteJobPhoto(jobId, filename) },
    pocketbase: async () => { await photosPb.deleteJobPhoto(jobId, filename) },
    buildQueue: () => ({ type: 'deleteJobPhoto', params: { jobId, filename } }),
  })
}

export async function getVehiclesForClient(clientId: string): Promise<Vehicle[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? vehiclesPb.getVehiclesForClient(clientId)
    : vehiclesLocal.getVehiclesForClient(clientId)
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  return (await resolveBackend()) === 'pocketbase'
    ? vehiclesPb.getVehicle(id)
    : vehiclesLocal.getVehicle(id)
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => vehiclesLocal.createVehicle(input),
    pocketbase: () => vehiclesPb.createVehicle(input),
    buildQueue: (item) => ({ type: 'createVehicle', params: input, localVehicleId: item.id }),
  })
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle | null> {
  assertCanWrite()
  return (await resolveBackend()) === 'pocketbase'
    ? vehiclesPb.updateVehicle(id, input)
    : vehiclesLocal.updateVehicle(id, input)
}

export async function getDamageDocsForVehicle(vehicleId: string): Promise<DamageRecord[]> {
  return (await resolveBackend()) === 'pocketbase'
    ? damagePb.getDamageDocsForVehicle(vehicleId)
    : damageLocal.getDamageDocsForVehicle(vehicleId)
}

export async function getDamageDoc(id: string): Promise<DamageRecord | null> {
  return (await resolveBackend()) === 'pocketbase'
    ? damagePb.getDamageDoc(id)
    : damageLocal.getDamageDoc(id)
}

export async function createDamageDoc(
  input: DamageRecordInput,
  photoFile?: File | null
): Promise<DamageRecord> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => damageLocal.createDamageDoc(input),
    pocketbase: () => damagePb.createDamageDoc(input, photoFile),
    buildQueue: (item) => ({ type: 'createDamageDoc', params: input, localDamageId: item.id }),
  })
}

export async function updateDamageDocNote(id: string, note: string): Promise<DamageRecord | null> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => damageLocal.updateDamageDocNote(id, note),
    pocketbase: () => damagePb.updateDamageDocNote(id, note),
    buildQueue: () => ({ type: 'updateDamageDocNote', params: { id, note } }),
  })
}

export async function deleteDamageDoc(id: string): Promise<boolean> {
  const resolved = await resolveBackend()
  return executeWrite({
    resolvedBackend: resolved,
    local: () => damageLocal.deleteDamageDoc(id),
    pocketbase: () => damagePb.deleteDamageDoc(id),
    buildQueue: () => ({ type: 'deleteDamageDoc', params: { id } }),
  })
}

export { dataUrlToFile } from './damage-docs-pocketbase'

export async function getInvoiceLineTemplates() {
  return (await resolveBackend()) === 'pocketbase'
    ? lineTemplatesPb.getInvoiceLineTemplates()
    : lineTemplatesLocal.getInvoiceLineTemplates()
}

export async function saveInvoiceLineTemplate(
  input: Parameters<typeof lineTemplatesLocal.saveInvoiceLineTemplate>[0]
) {
  const resolved = await resolveBackend()
  return resolved === 'pocketbase'
    ? lineTemplatesPb.saveInvoiceLineTemplate(input)
    : lineTemplatesLocal.saveInvoiceLineTemplate(input)
}

export async function deleteInvoiceLineTemplate(id: string) {
  const resolved = await resolveBackend()
  return resolved === 'pocketbase'
    ? lineTemplatesPb.deleteInvoiceLineTemplate(id)
    : lineTemplatesLocal.deleteInvoiceLineTemplate(id)
}
