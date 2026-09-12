/**
 * IndexedDB-backed FIFO queue for PocketBase writes made while offline.
 */

import { scopedDbName } from './tenant'

export type QueueOperation =
  | { type: 'createJob'; params: import('./types').QuickJobData; localJobId: string }
  | { type: 'updateJob'; params: { id: string; data: import('./types').JobEditData } }
  | { type: 'deleteJob'; params: { id: string } }
  | { type: 'deleteClient'; params: { id: string } }
  | { type: 'createInvoiceForJob'; params: { jobId: string } }
  | { type: 'markInvoiceSent'; params: { invoiceId: string } }
  | { type: 'addPayment'; params: { invoiceId: string; payment: import('./types').Payment } }
  | { type: 'markInvoicePaid'; params: { invoiceId: string; method: string } }
  | { type: 'updateInvoice'; params: { invoiceId: string; patch: import('./api/invoices-local').InvoiceUpdate } }
  | { type: 'deleteInvoice'; params: { invoiceId: string } }
  | { type: 'duplicateInvoice'; params: { invoiceId: string } }
  | { type: 'createSupply'; params: import('./types').SupplyInput; localSupplyId: string }
  | { type: 'updateSupply'; params: { id: string; input: Partial<import('./types').SupplyInput> } }
  | { type: 'restockSupply'; params: { id: string; input: import('./types').RestockInput } }
  | { type: 'createEquipment'; params: import('./types').EquipmentInput; localEquipmentId: string }
  | { type: 'updateEquipment'; params: { id: string; input: Partial<import('./types').EquipmentInput> } }
  | { type: 'deleteEquipment'; params: { id: string } }
  | { type: 'createOverheadExpense'; params: import('./types').OverheadInput; localOverheadId: string }
  | { type: 'updateOverheadExpense'; params: { id: string; input: Partial<import('./types').OverheadInput> } }
  | { type: 'deleteOverheadExpense'; params: { id: string } }
  | { type: 'createBusinessExpense'; params: import('./types').BusinessExpenseInput; localBusinessExpenseId: string; localEquipmentId?: string }
  | { type: 'updateBusinessExpense'; params: { id: string; input: Partial<import('./types').BusinessExpenseInput> } }
  | { type: 'deleteBusinessExpense'; params: { id: string } }
  | { type: 'createSupplyPurchase'; params: import('./types').SupplyPurchaseInput; localBusinessExpenseId: string; localSupplyId?: string }
  | { type: 'updateSupplyPurchase'; params: { id: string; input: Partial<import('./types').SupplyPurchaseInput> } }
  | { type: 'deleteSupplyPurchase'; params: { id: string } }
  | { type: 'uploadJobPhoto'; params: { jobId: string; dataUrl: string; photoType: import('./types').PhotoType; filename: string } }
  | { type: 'deleteJobPhoto'; params: { jobId: string; filename: string } }
  | { type: 'uploadSupplyPhoto'; params: { id: string; dataUrl: string; filename: string } }
  | { type: 'clearSupplyPhoto'; params: { id: string } }
  | { type: 'uploadEquipmentPhoto'; params: { id: string; dataUrl: string; filename: string } }
  | { type: 'clearEquipmentPhoto'; params: { id: string } }
  | { type: 'createVehicle'; params: import('./types').VehicleInput; localVehicleId: string }
  | { type: 'createDamageDoc'; params: import('./types').DamageRecordInput; localDamageId: string }
  | { type: 'updateDamageDocNote'; params: { id: string; note: string } }
  | { type: 'deleteDamageDoc'; params: { id: string } }

export interface QueueItem {
  id: string
  operation: QueueOperation
  createdAt: string
  retries: number
}

const DB_NAME = 'detailing_offline_v1'
const STORE = 'queue'
const DB_VERSION = 1

function dbName(): string {
  return scopedDbName(DB_NAME)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(dbName(), DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const store = transaction.objectStore(STORE)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result as T)
        request.onerror = () => reject(request.error)
      })
  )
}

export function generateQueueId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export async function enqueue(operation: QueueOperation): Promise<QueueItem> {
  const item: QueueItem = {
    id: generateQueueId(),
    operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  }
  await tx('readwrite', (store) => store.add(item))
  return item
}

export async function getQueueItems(): Promise<QueueItem[]> {
  const items = await tx<QueueItem[]>('readonly', (store) => store.getAll())
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getQueueCount(): Promise<number> {
  return tx('readonly', (store) => store.count())
}

export async function removeQueueItem(id: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(id))
}

export async function incrementRetries(id: string): Promise<void> {
  const items = await getQueueItems()
  const item = items.find((i) => i.id === id)
  if (!item) return
  item.retries += 1
  await tx('readwrite', (store) => store.put(item))
}

export async function clearQueue(): Promise<void> {
  await tx('readwrite', (store) => store.clear())
}
