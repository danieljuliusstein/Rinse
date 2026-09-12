import { ensurePocketBaseAuth } from '../pb-auth'
import { checkPocketBaseHealth, isPocketBaseConfigured } from '../pocketbase'
import {
  describeQueueItem,
  isDiscardableQueueError,
  purgeStaleQueueItems,
} from './queue-utils'
import {
  getQueueCount,
  getQueueItems,
  incrementRetries,
  removeQueueItem,
  type QueueItem,
} from '../offline-queue'
import * as invPb from './invoices-pocketbase'
import * as overheadPb from './overhead-pocketbase'
import * as businessExpensesPb from './business-expenses-pocketbase'
import * as supplyPurchasesPb from './supply-purchases-pocketbase'
import * as photosPb from './photos-pocketbase'
import * as vehiclesPb from './vehicles-pocketbase'
import * as damagePb from './damage-docs-pocketbase'
import * as pb from './pocketbase'
import * as equipmentPb from './equipment-pocketbase'
import * as suppliesPb from './supplies-pocketbase'
import {
  preloadIdMaps,
  resolveClientId,
  resolveInvoiceId,
  resolveJobId,
  resolvePackageId,
} from './id-resolve'
import {
  clearMigratedFlag,
  getMigrationStatus,
  isMigrated,
  migrateLocalToPocketBase,
  type MigrationResult,
} from './migrate'

export type { MigrationResult, MigrationStatus } from './migrate'
export { getMigrationStatus, isMigrated }

export interface FlushResult {
  processed: number
  failed: number
  remaining: number
  errors: string[]
}

export interface SyncStatus {
  online: boolean
  pocketBaseConfigured: boolean
  pocketBaseHealthy: boolean
  pendingWrites: number
  migrated: boolean
}

/** Maps local IDs → PocketBase IDs built during queue flush */
export class IdMaps {
  jobs = new Map<string, string>()
  supplies = new Map<string, string>()
  equipment = new Map<string, string>()
  overhead = new Map<string, string>()
  businessExpenses = new Map<string, string>()
  invoices = new Map<string, string>()

  resolveJob(id: string): string {
    return this.jobs.get(id) ?? id
  }

  resolveSupply(id: string): string {
    return this.supplies.get(id) ?? id
  }

  resolveEquipment(id: string): string {
    return this.equipment.get(id) ?? id
  }

  resolveOverhead(id: string): string {
    return this.overhead.get(id) ?? id
  }

  resolveBusinessExpense(id: string): string {
    return this.businessExpenses.get(id) ?? id
  }

  resolveInvoice(id: string): string {
    return this.invoices.get(id) ?? id
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

async function processItem(item: QueueItem, maps: IdMaps): Promise<void> {
  const op = item.operation

  switch (op.type) {
    case 'createJob': {
      const params = {
        ...op.params,
        packageId: await resolvePackageId(op.params.packageId),
        clientId: op.params.clientId ? await resolveClientId(op.params.clientId) : op.params.clientId,
      }
      const job = await pb.createJob(params)
      maps.jobs.set(op.localJobId, job.id)
      break
    }
    case 'updateJob': {
      const jobId = maps.resolveJob(op.params.id)
      const resolvedId = maps.jobs.has(op.params.id) ? jobId : await resolveJobId(op.params.id)
      maps.jobs.set(op.params.id, resolvedId)
      const data = { ...op.params.data }
      if (data.packageId) {
        data.packageId = await resolvePackageId(data.packageId)
      }
      await pb.updateJob(resolvedId, data)
      break
    }
    case 'deleteJob': {
      const localId = op.params.id
      if (maps.jobs.has(localId)) {
        const result = await pb.deleteJob(maps.jobs.get(localId)!)
        if (!result.ok) throw new Error(result.error ?? 'Failed to delete job')
        maps.jobs.delete(localId)
        break
      }
      try {
        const resolvedId = await resolveJobId(localId)
        const result = await pb.deleteJob(resolvedId)
        if (!result.ok) throw new Error(result.error ?? 'Failed to delete job')
      } catch {
        // Job never synced to server — nothing to delete remotely.
      }
      break
    }
    case 'deleteClient': {
      const localId = op.params.id
      try {
        const resolvedId = await resolveClientId(localId)
        const result = await pb.deleteClient(resolvedId)
        if (!result.ok) throw new Error(result.error ?? 'Failed to delete client')
      } catch {
        // Client never synced to server — nothing to delete remotely.
      }
      break
    }
    case 'createInvoiceForJob': {
      const jobId = maps.resolveJob(op.params.jobId)
      const resolvedId = maps.jobs.has(op.params.jobId) ? jobId : await resolveJobId(op.params.jobId)
      maps.jobs.set(op.params.jobId, resolvedId)
      const invoice = await invPb.createInvoiceForJob(resolvedId)
      maps.invoices.set(op.params.jobId, invoice.id)
      break
    }
    case 'markInvoiceSent': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      await invPb.markInvoiceSent(resolvedId)
      break
    }
    case 'addPayment': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      await invPb.addPayment(resolvedId, op.params.payment)
      break
    }
    case 'markInvoicePaid': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      await invPb.markInvoicePaid(resolvedId, op.params.method)
      break
    }
    case 'updateInvoice': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      await invPb.updateInvoice(resolvedId, op.params.patch)
      break
    }
    case 'deleteInvoice': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      await invPb.deleteInvoice(resolvedId)
      break
    }
    case 'duplicateInvoice': {
      const invoiceId = maps.resolveInvoice(op.params.invoiceId)
      const resolvedId = maps.invoices.has(op.params.invoiceId)
        ? invoiceId
        : await resolveInvoiceId(op.params.invoiceId)
      const invoice = await invPb.duplicateInvoice(resolvedId)
      maps.invoices.set(op.params.invoiceId, invoice.id)
      break
    }
    case 'createSupply': {
      const supply = await suppliesPb.createSupply(op.params)
      maps.supplies.set(op.localSupplyId, supply.id)
      break
    }
    case 'updateSupply': {
      const supplyId = maps.resolveSupply(op.params.id)
      await suppliesPb.updateSupply(supplyId, op.params.input)
      break
    }
    case 'restockSupply': {
      const supplyId = maps.resolveSupply(op.params.id)
      await suppliesPb.restockSupply(supplyId, op.params.input)
      break
    }
    case 'createEquipment': {
      const item = await equipmentPb.createEquipment(op.params)
      maps.equipment.set(op.localEquipmentId, item.id)
      break
    }
    case 'updateEquipment': {
      const equipmentId = maps.resolveEquipment(op.params.id)
      await equipmentPb.updateEquipment(equipmentId, op.params.input)
      break
    }
    case 'deleteEquipment': {
      const equipmentId = maps.resolveEquipment(op.params.id)
      await equipmentPb.deleteEquipment(equipmentId)
      break
    }
    case 'createOverheadExpense': {
      const expense = await overheadPb.createOverheadExpense(op.params)
      maps.overhead.set(op.localOverheadId, expense.id)
      break
    }
    case 'updateOverheadExpense': {
      const expenseId = maps.resolveOverhead(op.params.id)
      await overheadPb.updateOverheadExpense(expenseId, op.params.input)
      break
    }
    case 'deleteOverheadExpense': {
      const expenseId = maps.resolveOverhead(op.params.id)
      await overheadPb.deleteOverheadExpense(expenseId)
      break
    }
    case 'createBusinessExpense': {
      const params = { ...op.params }
      if (params.equipment_id) params.equipment_id = maps.resolveEquipment(params.equipment_id)
      const expense = await businessExpensesPb.createBusinessExpense(params)
      maps.businessExpenses.set(op.localBusinessExpenseId, expense.id)
      if (op.localEquipmentId && expense.equipment_id) {
        maps.equipment.set(op.localEquipmentId, expense.equipment_id)
      }
      break
    }
    case 'updateBusinessExpense': {
      const expenseId = maps.resolveBusinessExpense(op.params.id)
      await businessExpensesPb.updateBusinessExpense(expenseId, op.params.input)
      break
    }
    case 'deleteBusinessExpense': {
      const expenseId = maps.resolveBusinessExpense(op.params.id)
      await businessExpensesPb.deleteBusinessExpense(expenseId)
      break
    }
    case 'createSupplyPurchase': {
      const params = { ...op.params }
      if (params.supply_id) params.supply_id = maps.resolveSupply(params.supply_id)
      const expense = await supplyPurchasesPb.createSupplyPurchase(params)
      maps.businessExpenses.set(op.localBusinessExpenseId, expense.id)
      if (op.localSupplyId && expense.supply_id) {
        maps.supplies.set(op.localSupplyId, expense.supply_id)
      }
      break
    }
    case 'updateSupplyPurchase': {
      const expenseId = maps.resolveBusinessExpense(op.params.id)
      await supplyPurchasesPb.updateSupplyPurchase(expenseId, op.params.input)
      break
    }
    case 'deleteSupplyPurchase': {
      const expenseId = maps.resolveBusinessExpense(op.params.id)
      await supplyPurchasesPb.deleteSupplyPurchase(expenseId)
      break
    }
    case 'uploadJobPhoto': {
      const jobId = maps.resolveJob(op.params.jobId)
      const resolvedId = maps.jobs.has(op.params.jobId) ? jobId : await resolveJobId(op.params.jobId)
      maps.jobs.set(op.params.jobId, resolvedId)
      const file = dataUrlToFile(op.params.dataUrl, op.params.filename)
      await photosPb.uploadJobPhoto(resolvedId, file, op.params.photoType)
      break
    }
    case 'deleteJobPhoto': {
      const jobId = maps.resolveJob(op.params.jobId)
      const resolvedId = maps.jobs.has(op.params.jobId) ? jobId : await resolveJobId(op.params.jobId)
      maps.jobs.set(op.params.jobId, resolvedId)
      await photosPb.deleteJobPhoto(resolvedId, op.params.filename)
      break
    }
    case 'uploadSupplyPhoto': {
      const supplyId = maps.resolveSupply(op.params.id)
      const file = await suppliesPb.dataUrlToFile(op.params.dataUrl, op.params.filename)
      await suppliesPb.uploadSupplyPhoto(supplyId, file)
      break
    }
    case 'clearSupplyPhoto': {
      const supplyId = maps.resolveSupply(op.params.id)
      await suppliesPb.clearSupplyPhoto(supplyId)
      break
    }
    case 'uploadEquipmentPhoto': {
      const equipmentId = maps.resolveEquipment(op.params.id)
      const file = await suppliesPb.dataUrlToFile(op.params.dataUrl, op.params.filename)
      await equipmentPb.uploadEquipmentPhoto(equipmentId, file)
      break
    }
    case 'clearEquipmentPhoto': {
      const equipmentId = maps.resolveEquipment(op.params.id)
      await equipmentPb.clearEquipmentPhoto(equipmentId)
      break
    }
    case 'createVehicle': {
      await vehiclesPb.createVehicle(op.params)
      break
    }
    case 'createDamageDoc': {
      let photoFile: File | null = null
      if (op.params.photo_url?.startsWith('data:')) {
        photoFile = await damagePb.dataUrlToFile(op.params.photo_url)
      }
      await damagePb.createDamageDoc(op.params, photoFile)
      break
    }
    case 'updateDamageDocNote': {
      await damagePb.updateDamageDocNote(op.params.id, op.params.note)
      break
    }
    case 'deleteDamageDoc': {
      await damagePb.deleteDamageDoc(op.params.id)
      break
    }
  }
}

export async function flushOfflineQueue(): Promise<FlushResult> {
  const result: FlushResult = { processed: 0, failed: 0, remaining: 0, errors: [] }

  if (!isPocketBaseConfigured()) return result

  const healthy = await checkPocketBaseHealth()
  if (!healthy) {
    result.remaining = await getQueueCount()
    return result
  }

  if (!(await ensurePocketBaseAuth())) {
    result.remaining = await getQueueCount()
    result.errors.push('PocketBase authentication failed')
    return result
  }

  await purgeStaleQueueItems()

  const items = await getQueueItems()
  const maps = new IdMaps()
  preloadIdMaps(maps)

  for (const item of items) {
    try {
      await processItem(item, maps)
      await removeQueueItem(item.id)
      result.processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.failed++

      if (isDiscardableQueueError(err)) {
        await removeQueueItem(item.id)
        result.errors.push(`Discarded stale sync (${describeQueueItem(item)}): ${message}`)
        continue
      }

      await incrementRetries(item.id)
      if (item.retries + 1 >= 3) {
        await removeQueueItem(item.id)
        result.errors.push(`Discarded after 3 retries (${describeQueueItem(item)}): ${message}`)
      } else {
        result.errors.push(message)
      }
    }
  }

  result.remaining = await getQueueCount()
  return result
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  const pocketBaseConfigured = isPocketBaseConfigured()
  const pocketBaseHealthy = pocketBaseConfigured && online ? await checkPocketBaseHealth() : false
  const pendingWrites = typeof indexedDB !== 'undefined' ? await getQueueCount() : 0

  return {
    online,
    pocketBaseConfigured,
    pocketBaseHealthy,
    pendingWrites,
    migrated: isMigrated(),
  }
}

export async function runDataMigration(options?: { force?: boolean }): Promise<MigrationResult> {
  if (options?.force) {
    const counts = await pb.getCollectionCounts()
    if (counts.jobs > 0) {
      throw new Error('PocketBase already has jobs — cannot force migration')
    }
    clearMigratedFlag()
  }

  if (!isPocketBaseConfigured()) {
    throw new Error('PocketBase is not configured')
  }

  const healthy = await checkPocketBaseHealth()
  if (!healthy) throw new Error('PocketBase is unreachable')

  if (!(await ensurePocketBaseAuth())) {
    throw new Error('PocketBase authentication failed')
  }

  return migrateLocalToPocketBase()
}

export { purgeStaleQueueItems } from './queue-utils'

export async function syncOnReconnect(): Promise<FlushResult> {
  const flush = await flushOfflineQueue()
  if (flush.processed > 0 && !isMigrated()) {
    try {
      await migrateLocalToPocketBase()
    } catch {
      // migration may already be done
    }
  }
  return flush
}
