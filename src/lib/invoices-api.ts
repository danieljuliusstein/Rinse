import type { Invoice, InvoiceStatus, JobPhoto, Payment, PhotoMeta, PhotoType } from '@rinse/core'
import {
  buildInvoiceFromJob,
  generateInvoiceNumber,
  generatePocketBaseId,
  isJobPhotoTypeAtLimit,
  jobPhotoLimitMessage,
  normalizeBillingLines,
  normalizeInvoice,
} from '@rinse/core'
import { recalculateInvoiceTotals } from './invoice-totals'
import { getPocketBase } from './pocketbase'
import { formatPocketBaseError } from './pocketbase-errors'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { isOfflineWritesEnabled } from './subscription-fetch'
import { enqueue } from './offline/queue'
import { fileUriToDataUrl } from './offline/sync-files'
import { uploadPocketBaseFile } from './upload-file'

export function mapInvoiceFromRecord(record: Record<string, unknown>): Invoice {
  const payments = Array.isArray(record.payments) ? (record.payments as Payment[]) : []
  return normalizeInvoice({
    id: String(record.id),
    invoice_number: String(record.invoice_number ?? ''),
    job_id: String(record.job_id ?? ''),
    client_id: String(record.client_id ?? ''),
    subtotal: Number(record.subtotal ?? 0),
    tip: Number(record.tip ?? 0),
    total: Number(record.total ?? 0),
    status: (record.status as InvoiceStatus) ?? 'draft',
    payments,
    amount_paid: Number(record.amount_paid ?? 0),
    balance_due: Number(record.balance_due ?? 0),
    sent_at: record.sent_at ? String(record.sent_at) : undefined,
    paid_at: record.paid_at ? String(record.paid_at) : undefined,
    terms: record.terms ? String(record.terms) : undefined,
    notes: record.notes ? String(record.notes) : undefined,
    discount_amount: record.discount_amount != null ? Number(record.discount_amount) : undefined,
    tax_rate: record.tax_rate != null ? Number(record.tax_rate) : undefined,
    tax_amount: record.tax_amount != null ? Number(record.tax_amount) : undefined,
    po_number: record.po_number ? String(record.po_number) : undefined,
    extra_line_items: Array.isArray(record.extra_line_items)
      ? normalizeBillingLines(record.extra_line_items as Invoice['extra_line_items'])
      : undefined,
  })
}

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

async function assertOnline(action: string) {
  if (!(await isOnline())) {
    throw new Error(`${action} requires an internet connection`)
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  await assertOnline('Loading invoices')
  const records = await pb().collection('invoices').getFullList({ sort: '-id' })
  return records.map((r) => mapInvoiceFromRecord(r as Record<string, unknown>))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  await assertOnline('Loading invoice')
  try {
    const record = await pb().collection('invoices').getOne(id)
    return mapInvoiceFromRecord(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  await assertOnline('Loading invoice')
  const escaped = jobId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('invoices').getFullList({
    filter: `job_id = "${escaped}"`,
    limit: 1,
  })
  if (records.length === 0) return null
  return mapInvoiceFromRecord(records[0] as Record<string, unknown>)
}

export async function createInvoiceForJob(jobId: string): Promise<Invoice> {
  await assertOnline('Creating invoice')
  const existing = await getInvoiceByJobId(jobId)
  if (existing) return existing

  const orgId = requireOrganizationId()
  const job = await pb().collection('jobs').getOne(jobId)
  const all = await listInvoices()
  const draft = buildInvoiceFromJob({
    jobId,
    clientId: String(job.client_id),
    revenue: Number(job.revenue ?? 0),
    tip: Number(job.tip ?? 0),
    invoiceNumber: generateInvoiceNumber(all),
  })

  const created = await pb().collection('invoices').create({
    organization_id: orgId,
    invoice_number: draft.invoice_number,
    job_id: jobId,
    client_id: draft.client_id,
    subtotal: draft.subtotal,
    tip: draft.tip,
    total: draft.total,
    status: draft.status,
    payments: draft.payments,
    amount_paid: draft.amount_paid,
    balance_due: draft.balance_due,
    terms: draft.terms,
    extra_line_items: Array.isArray(job.extra_line_items) ? job.extra_line_items : [],
  })

  await pb().collection('jobs').update(jobId, {
    invoice_id: created.id,
    status: 'invoiced',
  })

  return mapInvoiceFromRecord(created as Record<string, unknown>)
}

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  await assertOnline('Updating invoice')
  const updated = await pb().collection('invoices').update(invoiceId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
  return mapInvoiceFromRecord(updated as Record<string, unknown>)
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<Invoice> {
  await assertOnline('Recording payment')
  const current = await getInvoice(invoiceId)
  if (!current) throw new Error('Invoice not found')

  const payments = [...current.payments, payment]
  const normalized = normalizeInvoice({ ...current, payments })

  const updated = await pb().collection('invoices').update(invoiceId, {
    payments,
    amount_paid: normalized.amount_paid,
    balance_due: normalized.balance_due,
    status: normalized.status,
    paid_at: normalized.paid_at ?? '',
  })

  if (normalized.status === 'paid') {
    await pb().collection('jobs').update(normalized.job_id, { status: 'paid' })
  }

  return mapInvoiceFromRecord(updated as Record<string, unknown>)
}

export type InvoiceUpdate = Partial<
  Pick<
    Invoice,
    | 'discount_amount'
    | 'tax_rate'
    | 'tax_amount'
    | 'po_number'
    | 'terms'
    | 'notes'
    | 'extra_line_items'
    | 'subtotal'
  >
>

export async function updateInvoice(invoiceId: string, patch: InvoiceUpdate): Promise<Invoice> {
  await assertOnline('Updating invoice')
  const current = await getInvoice(invoiceId)
  if (!current) throw new Error('Invoice not found')
  const merged = recalculateInvoiceTotals({ ...current, ...patch })

  const payload: Record<string, unknown> = {
    total: merged.total,
    balance_due: merged.balance_due,
    amount_paid: merged.amount_paid,
    status: merged.status,
  }
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

  const updated = await pb().collection('invoices').update(invoiceId, payload)
  return mapInvoiceFromRecord(updated as Record<string, unknown>)
}

export async function markInvoicePaid(invoiceId: string, method: string): Promise<Invoice> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  if (invoice.balance_due <= 0) return invoice
  return addPayment(invoiceId, {
    amount: invoice.balance_due,
    method,
    date: new Date().toISOString().split('T')[0],
  })
}

function photoUrl(record: Record<string, unknown>, filename: string, fileToken?: string): string {
  return pb().files.getURL(record, filename, fileToken ? { token: fileToken } : undefined)
}

export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  await assertOnline('Loading photos')
  const client = pb()
  const record = await client.collection('jobs').getOne(jobId)
  const filenames = Array.isArray(record.photos) ? (record.photos as string[]) : []
  const meta = Array.isArray(record.photo_meta) ? (record.photo_meta as PhotoMeta[]) : []

  let fileToken: string | undefined
  if (filenames.length > 0) {
    try {
      fileToken = await client.files.getToken()
    } catch {
      fileToken = undefined
    }
  }

  return filenames.map((filename) => {
    const entry = meta.find((m) => m.filename === filename)
    return {
      filename,
      url: photoUrl(record as Record<string, unknown>, filename, fileToken),
      type: entry?.type ?? 'after',
    }
  })
}

export async function uploadJobPhoto(
  jobId: string,
  fileUri: string,
  filename: string,
  mimeType: string,
  type: PhotoType
): Promise<JobPhoto> {
  const offlineEnabled = await isOfflineWritesEnabled()
  const online = await isOnline()

  const tryOnline = async (): Promise<JobPhoto> => {
    const client = pb()
    const record = await client.collection('jobs').getOne(jobId)
    const existingMeta = Array.isArray(record.photo_meta) ? [...(record.photo_meta as PhotoMeta[])] : []
    const typeCount = existingMeta.filter((m) => m.type === type).length
    if (isJobPhotoTypeAtLimit(typeCount)) {
      throw new Error(jobPhotoLimitMessage(type))
    }

    let updated: Record<string, unknown>
    try {
      updated = await uploadPocketBaseFile({
        collection: 'jobs',
        recordId: jobId,
        field: 'photos+',
        fileUri,
        filename,
        mimeType,
      })
    } catch (err) {
      throw new Error(formatPocketBaseError(err, 'Upload failed'))
    }

    const filenames = Array.isArray(updated.photos) ? (updated.photos as string[]) : []
    const newFilename =
      filenames.find((f) => !existingMeta.some((m) => m.filename === f)) ?? filenames[filenames.length - 1]

    if (!newFilename) {
      throw new Error('Photo upload did not return a filename')
    }

    existingMeta.push({ filename: newFilename, type })
    await client.collection('jobs').update(jobId, { photo_meta: existingMeta })

    const final = await client.collection('jobs').getOne(jobId)
    let fileToken: string | undefined
    try {
      fileToken = await client.files.getToken()
    } catch {
      fileToken = undefined
    }
    return {
      filename: newFilename,
      url: photoUrl(final as Record<string, unknown>, newFilename, fileToken),
      type,
    }
  }

  if (online) {
    try {
      return await tryOnline()
    } catch (err) {
      if (!offlineEnabled) throw err
      const msg = err instanceof Error ? err.message : String(err)
      if (!/network|fetch|timeout|abort|unreachable|failed to connect/i.test(msg)) throw err
    }
  }

  if (!offlineEnabled) {
    throw new Error('Uploading photo requires an internet connection')
  }

  const dataUrl = await fileUriToDataUrl(fileUri, mimeType)
  const queuedName = filename || `photo_${generatePocketBaseId()}.jpg`
  await enqueue({
    type: 'uploadJobPhoto',
    params: { jobId, dataUrl, photoType: type, filename: queuedName },
  })

  return {
    filename: queuedName,
    url: fileUri,
    type,
  }
}

export async function deleteJobPhoto(jobId: string, filename: string): Promise<void> {
  await assertOnline('Deleting photo')
  const record = await pb().collection('jobs').getOne(jobId)
  const meta = Array.isArray(record.photo_meta)
    ? (record.photo_meta as PhotoMeta[]).filter((m) => m.filename !== filename)
    : []

  const formData = new FormData()
  formData.append('photos-', filename)
  await pb().collection('jobs').update(jobId, formData)
  await pb().collection('jobs').update(jobId, { photo_meta: meta })
}

export function invoiceBadgeTone(status: InvoiceStatus): 'draft' | 'green' | 'amber' | 'yellow' | 'red' {
  switch (status) {
    case 'paid':
      return 'green'
    case 'draft':
      return 'draft'
    case 'overdue':
      return 'red'
    case 'partial':
      return 'yellow'
    case 'sent':
    default:
      return 'amber'
  }
}
