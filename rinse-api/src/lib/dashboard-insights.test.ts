import { describe, expect, it } from 'vitest'
import { buildDashboardInsights, pickDashboardInsight } from './dashboard-insights'
import type { DashboardKpis, Invoice, JobWithRelations } from './types'

const baseKpis: DashboardKpis = {
  revenueMtd: 1000,
  expensesMtd: 200,
  profitMtd: 800,
  marginMtd: 80,
  outstanding: 150,
  outstandingInvoiceCount: 2,
  revenueToday: 0,
  jobsThisWeek: 3,
}

function makeJob(overrides: Partial<JobWithRelations> = {}): JobWithRelations {
  const today = new Date().toISOString().split('T')[0]
  return {
    id: 'j1',
    client_id: 'c1',
    package_id: 'p1',
    date: today,
    status: 'completed',
    revenue: 200,
    tip: 0,
    vehicle_type: 'sedan',
    location_type: 'mobile',
    expenses: 20,
    supplies_used: [],
    client: { id: 'c1', name: 'Alex', phone: '', email: '', notes: '', created: '', updated: '' },
    package: { id: 'p1', name: 'Full Detail', price: 200, duration_minutes: 120, created: '', updated: '' },
    ...overrides,
  } as JobWithRelations
}

describe('buildDashboardInsights', () => {
  it('includes average job value when mtd jobs exist', () => {
    const insights = buildDashboardInsights([makeJob()], [], baseKpis, 500)
    expect(insights.some((i) => i.startsWith('Average job value:'))).toBe(true)
  })

  it('includes best-performing service', () => {
    const insights = buildDashboardInsights([makeJob()], [], baseKpis, 500)
    expect(insights).toContain('Best-performing service: Full Detail')
  })

  it('reports revenue growth vs prior month', () => {
    const insights = buildDashboardInsights([], [], baseKpis, 500)
    expect(insights.some((i) => i.includes('up') && i.includes('last month'))).toBe(true)
  })

  it('reports invoice paid percentage', () => {
    const sentAt = new Date().toISOString().split('T')[0]
    const invoices: Invoice[] = [
      { id: 'i1', job_id: 'j1', status: 'paid', total: 100, balance_due: 0, sent_at: sentAt, created: '', updated: '' },
      { id: 'i2', job_id: 'j2', status: 'sent', total: 100, balance_due: 100, sent_at: sentAt, created: '', updated: '' },
    ]
    const insights = buildDashboardInsights([], invoices, baseKpis, 0)
    expect(insights.some((i) => i.includes('invoices paid'))).toBe(true)
  })
})

describe('pickDashboardInsight', () => {
  it('returns null for empty list', () => {
    expect(pickDashboardInsight([])).toBeNull()
  })

  it('picks deterministically from seed', () => {
    const insights = ['A', 'B', 'C']
    expect(pickDashboardInsight(insights, 1)).toBe('B')
    expect(pickDashboardInsight(insights, 2)).toBe('C')
  })
})
