import type { Invoice, JobWithRelations } from '@rinse/core'

const SEND_PRIORITY: Record<Invoice['status'], number> = {
  draft: 0,
  sent: 1,
  partial: 2,
  overdue: 3,
  paid: 99,
}

/** Deepest unpaid invoice to send — draft first, then sent/partial/overdue. */
export function findSendInvoicePath(invoices: Invoice[], jobs: JobWithRelations[]): string {
  const jobById = new Map(jobs.map((j) => [j.id, j]))
  const candidates = invoices
    .filter((inv) => inv.status !== 'paid')
    .sort((a, b) => SEND_PRIORITY[a.status] - SEND_PRIORITY[b.status])

  for (const inv of candidates) {
    const job = jobById.get(inv.job_id)
    if (job) return `/invoices/${inv.id}`
  }

  return '/invoices/new'
}
