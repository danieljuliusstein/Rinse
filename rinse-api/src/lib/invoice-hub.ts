import type { Invoice, InvoiceStatus, JobWithRelations } from './types'

const SEND_PRIORITY: Record<InvoiceStatus, number> = {
  draft: 0,
  sent: 1,
  partial: 2,
  overdue: 3,
  paid: 99,
}

/** Deepest unpaid invoice to send — draft first, then sent/partial/overdue. */
export function findSendInvoicePath(
  invoices: Invoice[],
  jobs: JobWithRelations[]
): string {
  const jobById = new Map(jobs.map((j) => [j.id, j]))
  const candidates = invoices
    .filter((inv) => inv.status !== 'paid')
    .sort((a, b) => SEND_PRIORITY[a.status] - SEND_PRIORITY[b.status])

  for (const inv of candidates) {
    const job = jobById.get(inv.job_id)
    if (job) return `/jobs/${job.id}/invoice`
  }

  return '/invoices/new'
}
