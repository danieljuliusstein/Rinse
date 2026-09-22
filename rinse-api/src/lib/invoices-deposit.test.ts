import { describe, expect, it } from 'vitest'
import { buildInvoiceFromJob } from './invoices'

describe('buildInvoiceFromJob deposit auto-crediting', () => {
  it('initializes draft with 0 amount_paid when no deposit is paid', () => {
    const inv = buildInvoiceFromJob({
      jobId: 'job-1',
      clientId: 'cli-1',
      revenue: 200,
      tip: 0,
      invoiceNumber: 'INV-100',
    })

    expect(inv.subtotal).toBe(200)
    expect(inv.total).toBe(200)
    expect(inv.payments).toEqual([])
    expect(inv.amount_paid).toBe(0)
    expect(inv.balance_due).toBe(200)
    expect(inv.status).toBe('draft')
  })

  it('credits paid deposit into payments, sets partial status and decreases balance_due', () => {
    const inv = buildInvoiceFromJob({
      jobId: 'job-2',
      clientId: 'cli-2',
      revenue: 250,
      tip: 20,
      invoiceNumber: 'INV-101',
      deposit_status: 'paid',
      deposit_amount: 50,
      deposit_paid_at: '2026-09-20T10:00:00Z',
    })

    expect(inv.subtotal).toBe(250)
    expect(inv.tip).toBe(20)
    expect(inv.total).toBe(270)
    expect(inv.payments).toHaveLength(1)
    expect(inv.payments[0]).toEqual({
      id: 'dep_job-2',
      amount: 50,
      method: 'stripe',
      date: '2026-09-20T10:00:00Z',
      note: 'Deposit paid at booking',
    })
    expect(inv.amount_paid).toBe(50)
    expect(inv.balance_due).toBe(220)
    expect(inv.status).toBe('partial')
  })

  it('sets status to paid if deposit covers the full total', () => {
    const inv = buildInvoiceFromJob({
      jobId: 'job-3',
      clientId: 'cli-3',
      revenue: 50,
      tip: 0,
      invoiceNumber: 'INV-102',
      deposit_status: 'paid',
      deposit_amount: 50,
    })

    expect(inv.total).toBe(50)
    expect(inv.amount_paid).toBe(50)
    expect(inv.balance_due).toBe(0)
    expect(inv.status).toBe('paid')
  })

  it('ignores deposit if deposit_status is due or waived', () => {
    const inv = buildInvoiceFromJob({
      jobId: 'job-4',
      clientId: 'cli-4',
      revenue: 150,
      tip: 0,
      invoiceNumber: 'INV-103',
      deposit_status: 'due',
      deposit_amount: 50,
    })

    expect(inv.payments).toEqual([])
    expect(inv.amount_paid).toBe(0)
    expect(inv.balance_due).toBe(150)
    expect(inv.status).toBe('draft')
  })
})
