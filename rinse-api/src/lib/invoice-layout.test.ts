import { describe, expect, it } from 'vitest'
import { buildInvoiceViewModel, formatInvoiceMoney } from './invoice-layout'
import type { AppSettings } from './settings'
import type { Invoice, JobWithRelations } from './types'

const settings: AppSettings = {
  business_name: 'QA Test Business',
  business_phone: '555-0100',
  business_email: 'qa@test.com',
  business_address: '',
  invoice_terms_footer: 'Due on receipt.',
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
}

function makeJob(overrides: Partial<JobWithRelations> = {}): JobWithRelations {
  return {
    id: 'j1',
    date: '2026-06-06',
    hours_worked: 2,
    location_type: 'mobile',
    package_id: 'p1',
    vehicle_type: 'suv',
    client_id: 'c1',
    status: 'invoiced',
    revenue: 21314,
    tip: 0,
    expenses: [],
    supplies_used: [],
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    client: { id: 'c1', name: 'Sam Rivera', phone: '555-9999', email: 'sam@example.com' },
    package: { id: 'p1', name: 'Full Detail', base_price: 21314, expected_return_days: 90, active: true },
    ...overrides,
  } as JobWithRelations
}

const invoice: Invoice = {
  id: 'i1',
  invoice_number: 'DET-2026-06-001',
  job_id: 'j1',
  client_id: 'c1',
  subtotal: 21314,
  tip: 0,
  total: 21314,
  status: 'sent',
  payments: [],
  amount_paid: 0,
  balance_due: 21314,
  sent_at: '2026-06-06',
}

describe('buildInvoiceViewModel', () => {
  it('uses package fallback when missing', () => {
    const vm = buildInvoiceViewModel(makeJob({ package: undefined }), invoice, settings)
    expect(vm.lineItems[0].description).toBe('Detailing service')
  })

  it('builds service context line', () => {
    const vm = buildInvoiceViewModel(makeJob(), invoice, settings)
    expect(vm.serviceContextLine).toContain('Suv')
    expect(vm.serviceContextLine).toContain('Mobile detail')
  })

  it('omits empty client contact fields', () => {
    const vm = buildInvoiceViewModel(
      makeJob({ client: { id: 'c1', name: 'Alex' } }),
      invoice,
      settings
    )
    expect(vm.billToPhone).toBeUndefined()
    expect(vm.billToEmail).toBeUndefined()
  })

  it('hides tip row when zero', () => {
    const vm = buildInvoiceViewModel(makeJob(), invoice, settings)
    expect(vm.showTip).toBe(false)
  })

  it('falls back to job date when sent_at is empty', () => {
    const vm = buildInvoiceViewModel(makeJob({ date: '2026-03-15' }), { ...invoice, sent_at: '' }, settings)
    expect(vm.issuedDateLabel).toBe('March 15, 2026')
    expect(vm.issuedDateLabel).not.toContain('Invalid')
  })
})

describe('formatInvoiceMoney', () => {
  it('omits cents for whole dollars', () => {
    expect(formatInvoiceMoney(21314)).toBe('$21,314')
  })

  it('shows cents when needed', () => {
    expect(formatInvoiceMoney(150.5)).toBe('$150.50')
  })
})
