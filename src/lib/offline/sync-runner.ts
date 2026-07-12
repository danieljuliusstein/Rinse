import type {
  ClientInput,
  DamageRecordInput,
  Invoice,
  JobEditData,
  Payment,
  PhotoMeta,
  QueueItem,
  QuickJobData,
  VehicleInput,
} from '@rinse/core'
import {
  buildInvoiceFromJob,
  generateInvoiceNumber,
  generatePocketBaseId,
  isJobPhotoTypeAtLimit,
  jobPhotoLimitMessage,
  normalizeInvoice,
} from '@rinse/core'
import { ClientResponseError } from 'pocketbase'
import { refreshAuthOnce } from '../auth'
import { jobPbCreateFields } from '../job-create'
import { recalculateInvoiceTotals } from '../invoice-totals'
import { mapInvoiceFromRecord } from '../invoices-api'
import { getPocketBase } from '../pocketbase'
import { isOnline } from '../network'
import { formatPocketBaseError } from '../pocketbase-errors'
import { requireOrganizationId } from '../org'
import {
  describeQueueOperation,
  isDiscardableSyncError,
  SyncAuthError,
  SyncConflictError,
  SyncNetworkError,
} from './sync-errors'
import { dataUrlToTempFile } from './sync-files'
import {
  getNextQueueItem,
  getQueueCount,
  incrementRetries,
  removeQueueItem,
} from './queue'
import { upsertMirrorRecord } from './mirror'

const MAX_RETRIES = 3

export interface SyncResult {
  processed: number
  failed: number
  remaining: number
  errors: string[]
  paused: boolean
}

function isAuthError(err: unknown): boolean {
  if (err instanceof SyncAuthError) return true
  if (err instanceof ClientResponseError && (err.status === 401 || err.status === 403)) return true
  return false
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof SyncNetworkError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /network|fetch|timeout|abort|unreachable|failed to connect/i.test(msg)
}

function withOrganization<T extends Record<string, unknown>>(
  payload: T,
  organizationId: string
): T & { organization_id: string } {
  return { ...payload, organization_id: organizationId }
}

function clientPayload(input: ClientInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    tags: input.tags ?? [],
    notes: input.notes ?? '',
    ...(input.lead_source ? { lead_source: input.lead_source } : {}),
  }
}

function jobCreatePayload(input: QuickJobData, clientId: string): Record<string, unknown> {
  return jobPbCreateFields({
    date: input.date,
    locationType: input.locationType,
    packageId: input.packageId,
    vehicleType: input.vehicleType,
    clientId,
    revenue: input.revenue,
    tip: input.tip,
    start_time: input.start_time,
    notes: input.notes,
    travel_cost: input.travel_cost,
    marketing_cost: input.marketing_cost,
    equipment_depreciation: input.equipment_depreciation,
    recurrence_cadence: input.recurrence_cadence,
    recurrence_anchor_date: input.recurrence_anchor_date,
  })
}

async function assertNoConflict(collection: string, id: string, localUpdated?: string): Promise<void> {
  if (!localUpdated) return
  const pb = getPocketBase()
  try {
    const remote = await pb.collection(collection).getOne(id)
    const remoteUpdated = remote.updated ? String(remote.updated) : ''
    if (remoteUpdated && remoteUpdated > localUpdated) {
      throw new SyncConflictError('Server has a newer version — refresh to see latest.', remoteUpdated)
    }
  } catch (err) {
    if (err instanceof SyncConflictError) throw err
    if (err instanceof ClientResponseError && err.status === 404) return
    throw err
  }
}

async function listInvoiceRecords(): Promise<Invoice[]> {
  const pb = getPocketBase()
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('invoices').getFullList({
    filter: `organization_id = "${escaped}"`,
  })
  return records.map((r) => mapInvoiceFromRecord(r as Record<string, unknown>))
}

async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  const pb = getPocketBase()
  const escaped = jobId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('invoices').getFullList({
    filter: `job_id = "${escaped}"`,
  })
  if (records.length === 0) return null
  return mapInvoiceFromRecord(records[0] as Record<string, unknown>)
}

async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const pb = getPocketBase()
  try {
    const record = await pb.collection('invoices').getOne(invoiceId)
    return mapInvoiceFromRecord(record as Record<string, unknown>)
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) return null
    throw err
  }
}

async function processQueueItem(item: QueueItem): Promise<void> {
  const pb = getPocketBase()
  const op = item.operation

  switch (op.type) {
    case 'createClient': {
      const payload = withOrganization(clientPayload(op.params), op.params.organization_id)
      try {
        const created = await pb.collection('clients').create({ id: op.recordId, ...payload })
        upsertMirrorRecord('clients', op.recordId, op.params.organization_id, created as Record<string, unknown>)
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 400 && /already exists/i.test(err.message)) {
          const retryId = generatePocketBaseId()
          const created = await pb.collection('clients').create({ id: retryId, ...payload })
          upsertMirrorRecord('clients', retryId, op.params.organization_id, created as Record<string, unknown>)
          return
        }
        throw err
      }
      break
    }
    case 'updateClient': {
      await assertNoConflict('clients', op.params.id)
      const data = clientPayload(op.params.data as ClientInput)
      const updated = await pb.collection('clients').update(op.params.id, data)
      const orgId = String(updated.organization_id ?? '')
      if (orgId) upsertMirrorRecord('clients', op.params.id, orgId, updated as Record<string, unknown>)
      break
    }
    case 'createJob': {
      const clientId = op.params.clientId
      if (!clientId) throw new Error('Job create requires clientId')
      const payload = withOrganization(
        jobCreatePayload(op.params, clientId),
        op.params.organization_id
      )
      try {
        const created = await pb.collection('jobs').create({ id: op.recordId, ...payload })
        upsertMirrorRecord('jobs', op.recordId, op.params.organization_id, created as Record<string, unknown>)
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 400 && /already exists/i.test(err.message)) {
          const retryId = generatePocketBaseId()
          const created = await pb.collection('jobs').create({ id: retryId, ...payload })
          upsertMirrorRecord('jobs', retryId, op.params.organization_id, created as Record<string, unknown>)
          return
        }
        throw err
      }
      break
    }
    case 'updateJob': {
      await assertNoConflict('jobs', op.params.id)
      const data: Record<string, unknown> = {}
      const patch = op.params.data as JobEditData
      if (patch.date !== undefined) data.date = patch.date
      if (patch.status !== undefined) data.status = patch.status
      if (patch.revenue !== undefined) data.revenue = patch.revenue
      if (patch.tip !== undefined) data.tip = patch.tip
      if (patch.notes !== undefined) data.notes = patch.notes
      if (patch.start_time !== undefined) data.start_time = patch.start_time
      if (patch.locationType !== undefined) data.location_type = patch.locationType
      if (patch.vehicleType !== undefined) data.vehicle_type = patch.vehicleType
      if (patch.packageId !== undefined) data.package_id = patch.packageId
      if (patch.hours_worked !== undefined) data.hours_worked = patch.hours_worked
      const updated = await pb.collection('jobs').update(op.params.id, data)
      const orgId = String(updated.organization_id ?? '')
      if (orgId) upsertMirrorRecord('jobs', op.params.id, orgId, updated as Record<string, unknown>)
      break
    }
    case 'deleteJob': {
      try {
        await pb.collection('jobs').delete(op.params.id)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    case 'deleteClient': {
      try {
        await pb.collection('clients').delete(op.params.id)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    case 'createInvoiceForJob': {
      const existing = await getInvoiceByJobId(op.params.jobId)
      if (existing) break
      const orgId = requireOrganizationId()
      const job = await pb.collection('jobs').getOne(op.params.jobId)
      const all = await listInvoiceRecords()
      const draft = buildInvoiceFromJob({
        jobId: op.params.jobId,
        clientId: String(job.client_id),
        revenue: Number(job.revenue ?? 0),
        tip: Number(job.tip ?? 0),
        invoiceNumber: generateInvoiceNumber(all),
      })
      const created = await pb.collection('invoices').create({
        organization_id: orgId,
        invoice_number: draft.invoice_number,
        job_id: op.params.jobId,
        client_id: draft.client_id,
        subtotal: draft.subtotal,
        tip: draft.tip,
        total: draft.total,
        status: draft.status,
        payments: draft.payments,
        amount_paid: draft.amount_paid,
        balance_due: draft.balance_due,
        terms: draft.terms,
      })
      await pb.collection('jobs').update(op.params.jobId, {
        invoice_id: created.id,
        status: 'invoiced',
      })
      break
    }
    case 'markInvoiceSent': {
      await pb.collection('invoices').update(op.params.invoiceId, {
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      break
    }
    case 'addPayment': {
      const current = await getInvoice(op.params.invoiceId)
      if (!current) throw new Error('Invoice not found')
      const payments = [...current.payments, op.params.payment]
      const normalized = normalizeInvoice({ ...current, payments })
      await pb.collection('invoices').update(op.params.invoiceId, {
        payments,
        amount_paid: normalized.amount_paid,
        balance_due: normalized.balance_due,
        status: normalized.status,
        paid_at: normalized.paid_at ?? '',
      })
      if (normalized.status === 'paid') {
        await pb.collection('jobs').update(normalized.job_id, { status: 'paid' })
      }
      break
    }
    case 'markInvoicePaid': {
      const invoice = await getInvoice(op.params.invoiceId)
      if (!invoice) throw new Error('Invoice not found')
      if (invoice.balance_due <= 0) break
      const payment: Payment = {
        amount: invoice.balance_due,
        method: op.params.method,
        date: new Date().toISOString().split('T')[0],
      }
      const payments = [...invoice.payments, payment]
      const normalized = normalizeInvoice({ ...invoice, payments })
      await pb.collection('invoices').update(op.params.invoiceId, {
        payments,
        amount_paid: normalized.amount_paid,
        balance_due: normalized.balance_due,
        status: normalized.status,
        paid_at: normalized.paid_at ?? '',
      })
      if (normalized.status === 'paid') {
        await pb.collection('jobs').update(normalized.job_id, { status: 'paid' })
      }
      break
    }
    case 'updateInvoice': {
      const current = await getInvoice(op.params.invoiceId)
      if (!current) throw new Error('Invoice not found')
      const merged = recalculateInvoiceTotals({ ...current, ...op.params.patch })
      const payload: Record<string, unknown> = {
        total: merged.total,
        balance_due: merged.balance_due,
        amount_paid: merged.amount_paid,
        status: merged.status,
      }
      const patch = op.params.patch
      if (patch.discount_amount !== undefined) payload.discount_amount = merged.discount_amount ?? 0
      if (patch.tax_rate !== undefined) {
        payload.tax_rate = merged.tax_rate ?? 0
        payload.tax_amount = merged.tax_amount ?? 0
      }
      if (patch.po_number !== undefined) payload.po_number = merged.po_number ?? ''
      if (patch.terms !== undefined) payload.terms = merged.terms ?? ''
      if (patch.notes !== undefined) payload.notes = merged.notes ?? ''
      if (patch.extra_line_items !== undefined) payload.extra_line_items = merged.extra_line_items ?? []
      if (patch.subtotal !== undefined) payload.subtotal = merged.subtotal
      await pb.collection('invoices').update(op.params.invoiceId, payload)
      break
    }
    case 'deleteInvoice': {
      try {
        await pb.collection('invoices').delete(op.params.invoiceId)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    case 'duplicateInvoice': {
      const current = await getInvoice(op.params.invoiceId)
      if (!current) throw new Error('Invoice not found')
      const orgId = requireOrganizationId()
      const all = await listInvoiceRecords()
      await pb.collection('invoices').create({
        organization_id: orgId,
        invoice_number: generateInvoiceNumber(all),
        job_id: current.job_id,
        client_id: current.client_id,
        subtotal: current.subtotal,
        tip: current.tip,
        discount_amount: current.discount_amount ?? 0,
        tax_rate: current.tax_rate ?? 0,
        tax_amount: current.tax_amount ?? 0,
        total: current.total,
        status: 'draft',
        payments: [],
        amount_paid: 0,
        balance_due: current.total,
        terms: current.terms ?? '',
        notes: current.notes ?? '',
        po_number: current.po_number ?? '',
        extra_line_items: current.extra_line_items ?? [],
      })
      break
    }
    case 'uploadJobPhoto': {
      const record = await pb.collection('jobs').getOne(op.params.jobId)
      const existingMeta = Array.isArray(record.photo_meta) ? [...(record.photo_meta as PhotoMeta[])] : []
      const typeCount = existingMeta.filter((m) => m.type === op.params.photoType).length
      if (isJobPhotoTypeAtLimit(typeCount)) {
        throw new Error(jobPhotoLimitMessage(op.params.photoType))
      }
      const file = await dataUrlToTempFile(op.params.dataUrl, op.params.filename)
      const formData = new FormData()
      formData.append('photos+', {
        uri: file.uri,
        name: file.filename,
        type: file.mimeType,
      } as unknown as Blob)
      const updated = await pb.collection('jobs').update(op.params.jobId, formData)
      const filenames = Array.isArray(updated.photos) ? (updated.photos as string[]) : []
      const newFilename =
        filenames.find((f) => !existingMeta.some((m) => m.filename === f)) ??
        filenames[filenames.length - 1]
      if (newFilename) {
        existingMeta.push({ filename: newFilename, type: op.params.photoType })
        await pb.collection('jobs').update(op.params.jobId, { photo_meta: existingMeta })
      }
      break
    }
    case 'deleteJobPhoto': {
      const record = await pb.collection('jobs').getOne(op.params.jobId)
      const meta = Array.isArray(record.photo_meta)
        ? (record.photo_meta as PhotoMeta[]).filter((m) => m.filename !== op.params.filename)
        : []
      const formData = new FormData()
      formData.append('photos-', op.params.filename)
      await pb.collection('jobs').update(op.params.jobId, formData)
      await pb.collection('jobs').update(op.params.jobId, { photo_meta: meta })
      break
    }
    case 'createVehicle': {
      const orgId = requireOrganizationId()
      const input = op.params as VehicleInput
      await pb.collection('vehicles').create({
        id: op.localVehicleId,
        organization_id: orgId,
        client_id: input.client_id,
        year: input.year ?? null,
        make: input.make,
        model: input.model,
        color: input.color ?? '',
        color_hex: input.color_hex ?? '',
        vin: input.vin ?? '',
        plate: input.plate ?? '',
        type: input.type ?? 'sedan',
      })
      break
    }
    case 'createDamageDoc': {
      const orgId = requireOrganizationId()
      const input = op.params as DamageRecordInput
      const formData = new FormData()
      formData.append('id', op.localDamageId)
      formData.append('organization_id', orgId)
      formData.append('vehicle_id', input.vehicle_id)
      formData.append('area', input.area)
      formData.append('note', input.note ?? '')
      formData.append('date', input.date)
      // Device-reported only — server hook overwrites uploaded_at.
      formData.append('captured_at', input.captured_at)
      if (input.linked_job_id) formData.append('job_id', input.linked_job_id)
      if (input.photo_url?.startsWith('data:')) {
        const file = await dataUrlToTempFile(input.photo_url, `damage_${op.localDamageId}.jpg`)
        formData.append('photo', {
          uri: file.uri,
          name: file.filename,
          type: file.mimeType,
        } as unknown as Blob)
      }
      await pb.collection('damage_docs').create(formData)
      break
    }
    case 'updateDamageDocNote': {
      await pb.collection('damage_docs').update(op.params.id, { note: op.params.note })
      break
    }
    case 'deleteDamageDoc': {
      try {
        await pb.collection('damage_docs').delete(op.params.id)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    default:
      throw new Error(`Unsupported queue operation: ${(op as { type: string }).type}`)
  }
}

async function processOneItem(item: QueueItem, result: SyncResult): Promise<'done' | 'auth_pause' | 'network_stop'> {
  try {
    await processQueueItem(item)
    await removeQueueItem(item.id)
    result.processed++
    return 'done'
  } catch (err) {
    if (isAuthError(err)) return 'auth_pause'

    const message = formatPocketBaseError(err, 'Sync failed')
    result.failed++
    result.errors.push(`${describeQueueOperation(item.operation)}: ${message}`)

    if (isDiscardableSyncError(err)) {
      await removeQueueItem(item.id)
      return 'done'
    }

    if (isNetworkError(err)) {
      await incrementRetries(item.id)
      return 'network_stop'
    }

    await incrementRetries(item.id)
    if (item.retries + 1 >= MAX_RETRIES) {
      await removeQueueItem(item.id)
      result.errors.push(`Discarded after ${MAX_RETRIES} retries`)
    }
    return 'network_stop'
  }
}

/** Sequential queue processor — one item at a time; no setInterval. */
export async function runSyncOnce(): Promise<SyncResult> {
  const result: SyncResult = {
    processed: 0,
    failed: 0,
    remaining: 0,
    errors: [],
    paused: false,
  }

  const online = await isOnline()
  if (!online) {
    result.remaining = await getQueueCount()
    return result
  }

  await refreshAuthOnce()

  let item = await getNextQueueItem()
  while (item) {
    const outcome = await processOneItem(item, result)

    if (outcome === 'auth_pause') {
      const refreshed = await refreshAuthOnce()
      if (!refreshed) {
        result.paused = true
        result.errors.push('Authentication expired — sign in again to continue sync')
        break
      }
      const retry = await processOneItem(item, result)
      if (retry === 'auth_pause' || retry === 'network_stop') break
    } else if (outcome === 'network_stop') {
      break
    }

    item = await getNextQueueItem()
  }

  result.remaining = await getQueueCount()
  return result
}
