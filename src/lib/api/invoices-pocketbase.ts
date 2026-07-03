import { getPocketBase } from '../pocketbase'
import { buildInvoiceFromJob, generateInvoiceNumber, normalizeInvoice } from '../invoices'
import { recalculateInvoiceTotals } from '../invoice-totals'
import { pbInvoiceToApp, escapeFilterValue, type PbRecord } from './mappers'
import { tenantFilter, withOrganization } from './tenant-pocketbase'
import type { Invoice, Payment } from '../types'
import type { InvoiceUpdate } from './invoices-local'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

export async function getInvoices(): Promise<Invoice[]> {
  const records = await pb().collection('invoices').getFullList<PbRecord>({ sort: '-id' })
  return records.map((r) => normalizeInvoice(pbInvoiceToApp(r)))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const record = await pb().collection('invoices').getOne<PbRecord>(id)
    return normalizeInvoice(pbInvoiceToApp(record))
  } catch {
    return null
  }
}

export async function getInvoiceByJobId(jobId: string): Promise<Invoice | null> {
  const escaped = escapeFilterValue(jobId)
  const records = await pb().collection('invoices').getFullList<PbRecord>({
    filter: tenantFilter(`job_id = "${escaped}"`),
    limit: 1,
  })
  if (records.length === 0) return null
  return normalizeInvoice(pbInvoiceToApp(records[0]))
}

export async function createInvoiceForJob(jobId: string): Promise<Invoice> {
  const existing = await getInvoiceByJobId(jobId)
  if (existing) return existing

  const job = await pb().collection('jobs').getOne<PbRecord>(jobId)
  const draft = buildInvoiceFromJob({
    jobId,
    clientId: String(job.client_id),
    revenue: Number(job.revenue ?? 0),
    tip: Number(job.tip ?? 0),
    invoiceNumber: 'PENDING',
  })

  const created = await pb().collection('invoices').create<PbRecord>(
    withOrganization({
      invoice_number: 'PENDING',
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
    }),
  )

  await pb().collection('jobs').update(jobId, {
    invoice_id: created.id,
    status: 'invoiced',
  })

  return normalizeInvoice(pbInvoiceToApp(created))
}

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  const updated = await pb().collection('invoices').update<PbRecord>(invoiceId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
  return normalizeInvoice(pbInvoiceToApp(updated))
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<Invoice> {
  const current = await getInvoice(invoiceId)
  if (!current) throw new Error('Invoice not found')

  const payments = [...current.payments, payment]
  const normalized = normalizeInvoice({ ...current, payments })

  const updated = await pb().collection('invoices').update<PbRecord>(invoiceId, {
    payments,
    amount_paid: normalized.amount_paid,
    balance_due: normalized.balance_due,
    status: normalized.status,
    paid_at: normalized.paid_at ?? '',
  })

  if (normalized.status === 'paid') {
    await pb().collection('jobs').update(normalized.job_id, { status: 'paid' })
  }

  return normalizeInvoice(pbInvoiceToApp(updated))
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

export async function updateInvoice(invoiceId: string, patch: InvoiceUpdate): Promise<Invoice> {
  const current = await getInvoice(invoiceId)
  if (!current) throw new Error('Invoice not found')
  const merged = recalculateInvoiceTotals({ ...current, ...patch })

  const payload: Record<string, unknown> = {}
  if (patch.discount_amount !== undefined) payload.discount_amount = merged.discount_amount ?? 0
  if (patch.tax_rate !== undefined) {
    payload.tax_rate = merged.tax_rate ?? 0
    payload.tax_amount = merged.tax_amount ?? 0
  }
  if (patch.po_number !== undefined) payload.po_number = merged.po_number ?? ''
  if (patch.terms !== undefined) payload.terms = merged.terms ?? ''
  if (patch.notes !== undefined) payload.notes = merged.notes ?? ''
  if (patch.signature_url !== undefined) payload.signature_url = merged.signature_url ?? ''
  if (patch.signed_at !== undefined) payload.signed_at = merged.signed_at ?? ''
  if (patch.extra_line_items !== undefined) payload.extra_line_items = merged.extra_line_items ?? []
  if (patch.subtotal !== undefined) payload.subtotal = merged.subtotal
  payload.total = merged.total
  payload.balance_due = merged.balance_due
  payload.amount_paid = merged.amount_paid
  payload.status = merged.status

  const updated = await pb().collection('invoices').update<PbRecord>(invoiceId, payload)
  return normalizeInvoice(pbInvoiceToApp(updated))
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  await pb().collection('invoices').delete(invoiceId)
  try {
    const job = await pb().collection('jobs').getOne<PbRecord>(invoice.job_id)
    if (String(job.invoice_id) === invoiceId) {
      await pb().collection('jobs').update(invoice.job_id, {
        invoice_id: '',
        status: job.status === 'paid' || job.status === 'invoiced' ? 'completed' : job.status,
      })
    }
  } catch {
    // job may be gone
  }
}

export async function duplicateInvoice(invoiceId: string): Promise<Invoice> {
  const invoice = await getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  const all = await getInvoices()
  const invoiceNumber = generateInvoiceNumber(all)
  const copy = recalculateInvoiceTotals({
    ...invoice,
    invoice_number: invoiceNumber,
    status: 'draft',
    payments: [],
    amount_paid: 0,
    sent_at: undefined,
    paid_at: undefined,
    signature_url: undefined,
    signed_at: undefined,
  })

  const created = await pb().collection('invoices').create<PbRecord>(
    withOrganization({
      invoice_number: copy.invoice_number,
      job_id: copy.job_id,
      client_id: copy.client_id,
      subtotal: copy.subtotal,
      tip: copy.tip,
      total: copy.total,
      status: copy.status,
      payments: [],
      amount_paid: 0,
      balance_due: copy.balance_due,
      terms: copy.terms,
      notes: copy.notes,
      discount_amount: copy.discount_amount ?? 0,
      tax_rate: copy.tax_rate ?? 0,
      tax_amount: copy.tax_amount ?? 0,
      po_number: copy.po_number ?? '',
      signature_url: '',
      signed_at: '',
    }),
  )

  await pb().collection('invoices').delete(invoiceId)
  await pb().collection('jobs').update(copy.job_id, { invoice_id: created.id, status: 'invoiced' })

  return normalizeInvoice(pbInvoiceToApp(created))
}
