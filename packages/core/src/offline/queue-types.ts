/**
 * Offline queue operation types — shared between PWA (IndexedDB) and native (SQLite).
 * Keep in sync with detailing-app/src/lib/offline-queue.ts
 */

import type {
  BusinessExpenseInput,
  ClientInput,
  DamageRecordInput,
  EquipmentInput,
  JobEditData,
  OverheadInput,
  Payment,
  PhotoType,
  QuickJobData,
  RestockInput,
  SupplyInput,
  SupplyPurchaseInput,
  VehicleInput,
} from '../types'
import type { InvoiceUpdate } from '../offline/invoice-update'

export type QueueOperation =
  | { type: 'createClient'; params: ClientInput & { organization_id: string }; recordId: string }
  | { type: 'updateClient'; params: { id: string; data: Partial<ClientInput> } }
  | { type: 'createJob'; params: QuickJobData & { organization_id: string }; recordId: string }
  | { type: 'updateJob'; params: { id: string; data: JobEditData } }
  | { type: 'deleteJob'; params: { id: string } }
  | { type: 'deleteClient'; params: { id: string } }
  | { type: 'createInvoiceForJob'; params: { jobId: string } }
  | { type: 'markInvoiceSent'; params: { invoiceId: string } }
  | { type: 'addPayment'; params: { invoiceId: string; payment: Payment } }
  | { type: 'markInvoicePaid'; params: { invoiceId: string; method: string } }
  | { type: 'updateInvoice'; params: { invoiceId: string; patch: InvoiceUpdate } }
  | { type: 'deleteInvoice'; params: { invoiceId: string } }
  | { type: 'duplicateInvoice'; params: { invoiceId: string } }
  | { type: 'createSupply'; params: SupplyInput; localSupplyId: string }
  | { type: 'updateSupply'; params: { id: string; input: Partial<SupplyInput> } }
  | { type: 'restockSupply'; params: { id: string; input: RestockInput } }
  | { type: 'createEquipment'; params: EquipmentInput; localEquipmentId: string }
  | { type: 'updateEquipment'; params: { id: string; input: Partial<EquipmentInput> } }
  | { type: 'deleteEquipment'; params: { id: string } }
  | { type: 'createOverheadExpense'; params: OverheadInput; localOverheadId: string }
  | { type: 'updateOverheadExpense'; params: { id: string; input: Partial<OverheadInput> } }
  | { type: 'deleteOverheadExpense'; params: { id: string } }
  | { type: 'createBusinessExpense'; params: BusinessExpenseInput; localBusinessExpenseId: string; localEquipmentId?: string }
  | { type: 'updateBusinessExpense'; params: { id: string; input: Partial<BusinessExpenseInput> } }
  | { type: 'deleteBusinessExpense'; params: { id: string } }
  | { type: 'createSupplyPurchase'; params: SupplyPurchaseInput; localBusinessExpenseId: string; localSupplyId?: string }
  | { type: 'updateSupplyPurchase'; params: { id: string; input: Partial<SupplyPurchaseInput> } }
  | { type: 'deleteSupplyPurchase'; params: { id: string } }
  | { type: 'uploadJobPhoto'; params: { jobId: string; dataUrl: string; photoType: PhotoType; filename: string } }
  | { type: 'deleteJobPhoto'; params: { jobId: string; filename: string } }
  | { type: 'uploadSupplyPhoto'; params: { id: string; dataUrl: string; filename: string } }
  | { type: 'clearSupplyPhoto'; params: { id: string } }
  | { type: 'uploadEquipmentPhoto'; params: { id: string; dataUrl: string; filename: string } }
  | { type: 'clearEquipmentPhoto'; params: { id: string } }
  | { type: 'createVehicle'; params: VehicleInput; localVehicleId: string }
  | { type: 'createDamageDoc'; params: DamageRecordInput; localDamageId: string }
  | { type: 'updateDamageDocNote'; params: { id: string; note: string } }
  | { type: 'deleteDamageDoc'; params: { id: string } }

export interface QueueItem {
  id: string
  operation: QueueOperation
  createdAt: string
  retries: number
}

export function generateQueueId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
