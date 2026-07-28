import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { uploadPocketBaseFile } from './upload-file'

const VALID_CATEGORIES: BusinessExpenseCategory[] = [
  'legal',
  'licensing',
  'taxes',
  'insurance',
  'vehicle',
  'marketing',
  'software',
  'equipment',
  'supplies',
  'other',
]

export type ReceiptImageAsset = {
  uri: string
  mimeType?: string
  fileName?: string
}

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function receiptFilename(receipt: unknown): string | undefined {
  if (typeof receipt === 'string' && receipt.trim()) return receipt.trim()
  if (Array.isArray(receipt) && receipt.length > 0) {
    const first = receipt[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
  }
  return undefined
}

function receiptUrlFor(record: Record<string, unknown>): string | undefined {
  const filename = receiptFilename(record.receipt)
  if (!filename) return undefined
  try {
    return pb().files.getURL(record, filename)
  } catch {
    return undefined
  }
}

function mapBusinessExpense(record: Record<string, unknown>): BusinessExpense {
  const category = record.category ? String(record.category) : undefined
  return {
    id: String(record.id),
    date: String(record.date ?? '').slice(0, 10),
    name: String(record.name ?? ''),
    amount: Number(record.amount ?? 0),
    category:
      category && VALID_CATEGORIES.includes(category as BusinessExpenseCategory)
        ? (category as BusinessExpenseCategory)
        : 'other',
    vendor: record.vendor ? String(record.vendor) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    receipt_url: receiptUrlFor(record),
    supply_id: record.supply_id ? String(record.supply_id) : undefined,
    equipment_id: record.equipment_id ? String(record.equipment_id) : undefined,
    quantity: record.quantity != null ? Number(record.quantity) : undefined,
    snapshot_qty_on_hand:
      record.snapshot_qty_on_hand != null ? Number(record.snapshot_qty_on_hand) : undefined,
    snapshot_cost_per_unit:
      record.snapshot_cost_per_unit != null ? Number(record.snapshot_cost_per_unit) : undefined,
  }
}

function textParams(input: BusinessExpenseInput, orgId: string): Record<string, string> {
  return {
    organization_id: orgId,
    date: input.date,
    name: input.name,
    amount: String(input.amount),
    category: input.category ?? 'other',
    vendor: input.vendor ?? '',
    notes: input.notes ?? '',
    supply_id: input.supply_id ?? '',
    equipment_id: input.equipment_id ?? '',
    quantity: String(input.quantity ?? 0),
    snapshot_qty_on_hand: String(input.snapshot_qty_on_hand ?? 0),
    snapshot_cost_per_unit: String(input.snapshot_cost_per_unit ?? 0),
  }
}

function toPb(input: BusinessExpenseInput) {
  return {
    date: input.date,
    name: input.name,
    amount: input.amount,
    category: input.category ?? 'other',
    vendor: input.vendor ?? '',
    notes: input.notes ?? '',
    supply_id: input.supply_id ?? '',
    equipment_id: input.equipment_id ?? '',
    quantity: input.quantity ?? 0,
    snapshot_qty_on_hand: input.snapshot_qty_on_hand ?? 0,
    snapshot_cost_per_unit: input.snapshot_cost_per_unit ?? 0,
  }
}

export async function listBusinessExpenses(): Promise<BusinessExpense[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('business_expenses').getFullList({
    filter: `organization_id = "${escaped}"`,
    sort: '-date',
  })
  return records.map((r) => mapBusinessExpense(r as Record<string, unknown>))
}

export async function createBusinessExpense(
  input: BusinessExpenseInput,
  receipt?: ReceiptImageAsset | null,
): Promise<BusinessExpense> {
  const orgId = requireOrganizationId()

  if (receipt?.uri) {
    const filename = receipt.fileName?.trim() || `receipt_${Date.now()}.jpg`
    const mimeType = receipt.mimeType?.trim() || 'image/jpeg'
    const record = await uploadPocketBaseFile({
      collection: 'business_expenses',
      recordId: '',
      field: 'receipt',
      fileUri: receipt.uri,
      filename,
      mimeType,
      method: 'POST',
      parameters: textParams(input, orgId),
    })
    return mapBusinessExpense(record)
  }

  const record = await pb().collection('business_expenses').create({
    organization_id: orgId,
    ...toPb(input),
  })
  return mapBusinessExpense(record as Record<string, unknown>)
}

export async function updateBusinessExpense(
  id: string,
  input: Partial<BusinessExpenseInput>,
  receipt?: ReceiptImageAsset | null,
): Promise<BusinessExpense | null> {
  try {
    if (receipt?.uri) {
      const patch: Record<string, string> = {}
      if (input.date != null) patch.date = input.date
      if (input.name != null) patch.name = input.name
      if (input.amount != null) patch.amount = String(input.amount)
      if (input.category != null) patch.category = input.category
      if (input.vendor != null) patch.vendor = input.vendor
      if (input.notes != null) patch.notes = input.notes
      const record = await uploadPocketBaseFile({
        collection: 'business_expenses',
        recordId: id,
        field: 'receipt',
        fileUri: receipt.uri,
        filename: receipt.fileName?.trim() || `receipt_${Date.now()}.jpg`,
        mimeType: receipt.mimeType?.trim() || 'image/jpeg',
        method: 'PATCH',
        parameters: patch,
      })
      return mapBusinessExpense(record)
    }

    const patch: Record<string, unknown> = {}
    if (input.date != null) patch.date = input.date
    if (input.name != null) patch.name = input.name
    if (input.amount != null) patch.amount = input.amount
    if (input.category != null) patch.category = input.category
    if (input.vendor != null) patch.vendor = input.vendor
    if (input.notes != null) patch.notes = input.notes
    const record = await pb().collection('business_expenses').update(id, patch)
    return mapBusinessExpense(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function deleteBusinessExpense(id: string): Promise<boolean> {
  try {
    await pb().collection('business_expenses').delete(id)
    return true
  } catch {
    return false
  }
}
