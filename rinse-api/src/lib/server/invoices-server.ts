import { normalizeInvoice } from '../invoices'
import { pbInvoiceToApp, type PbRecord } from '../api/mappers'
import type { Invoice, Payment } from '../types'
import { authenticateServerPocketBase } from './pocketbase-admin'

export async function getInvoiceServer(invoiceId: string): Promise<Invoice | null> {
  const pb = await authenticateServerPocketBase()
  try {
    const record = await pb.collection('invoices').getOne<PbRecord>(invoiceId)
    return normalizeInvoice(pbInvoiceToApp(record))
  } catch {
    return null
  }
}

export async function addPaymentServer(invoiceId: string, payment: Payment): Promise<Invoice> {
  const pb = await authenticateServerPocketBase()
  const current = await getInvoiceServer(invoiceId)
  if (!current) throw new Error('Invoice not found')

  const payments = [...current.payments, payment]
  const normalized = normalizeInvoice({ ...current, payments })

  const updated = await pb.collection('invoices').update<PbRecord>(invoiceId, {
    payments,
    amount_paid: normalized.amount_paid,
    balance_due: normalized.balance_due,
    status: normalized.status,
    paid_at: normalized.paid_at ?? '',
  })

  if (normalized.status === 'paid') {
    await pb.collection('jobs').update(normalized.job_id, { status: 'paid' })
  }

  return normalizeInvoice(pbInvoiceToApp(updated))
}
