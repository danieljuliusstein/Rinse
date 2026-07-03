import { describe, expect, it } from 'vitest'
import {
  computeDashboardKpis,
  csvJobStatusLabel,
  formatJobsDashboardCSV,
  rowTableNet,
  type JobExportRow,
  type JobExportSummary,
} from './jobs-dashboard-csv'

const sampleRows: JobExportRow[] = [
  {
    date: '2026-06-02',
    client: 'Marcus Bell',
    pkg: 'Full Detail',
    revenue: 420,
    tip: 40,
    expenses: 85,
    netProfit: 375,
    status: 'completed',
  },
  {
    date: '2026-06-23',
    client: 'Ryan Moss',
    pkg: 'Ceramic Coat',
    revenue: 150,
    tip: 0,
    expenses: 60,
    netProfit: 90,
    status: 'in_progress',
  },
  {
    date: '2026-06-27',
    client: 'Chloe Park',
    pkg: 'Full Detail',
    revenue: 420,
    tip: 0,
    expenses: 0,
    netProfit: 420,
    status: 'scheduled',
  },
]

const sampleSummary: JobExportSummary = {
  totalRevenue: 1010,
  totalExpenses: 145,
  netProfit: 885,
  jobCount: 3,
}

describe('JobsDashboard CSV (React reference)', () => {
  it('matches JobsDashboard KPI calculations', () => {
    const kpis = computeDashboardKpis(sampleRows)
    expect(kpis.revenue).toBe(990) // all jobs: 420+150+420
    expect(kpis.tips).toBe(40) // completed only
    expect(kpis.expenses).toBe(85) // completed only
    expect(kpis.netProfit).toBe(945) // 990 + 40 - 85
    expect(kpis.margin).toBe(95) // round(945/990*100)
    expect(kpis.completed).toBe(1)
    expect(kpis.avgTip).toBe(40)
  })

  it('includes dashboard sections and job rows', () => {
    const csv = formatJobsDashboardCSV(sampleRows, sampleSummary, {
      businessName: 'Rinse',
      periodLabel: 'June 2026',
      periodRange: 'Jun 1 – Jun 30, 2026',
    })

    expect(csv).toContain('Rinse — Jobs overview')
    expect(csv).toContain('KEY METRICS')
    expect(csv).toContain('REVENUE BY PACKAGE')
    expect(csv).toContain('DAILY REVENUE')
    expect(csv).toContain('ALL JOBS')
    expect(csv).toContain('Marcus Bell')
    expect(csv).toContain('Full Detail')
    expect(csv).toContain('Completed')
    expect(csv).toContain('Pending')
    expect(csv).toContain('Scheduled')
    expect(csv).not.toContain('SUMMARY')
    expect(csv).not.toContain('Total collected')
  })

  it('maps statuses like StatusPill', () => {
    expect(csvJobStatusLabel('in_progress')).toBe('Pending')
    expect(csvJobStatusLabel('scheduled')).toBe('Scheduled')
    expect(csvJobStatusLabel('paid')).toBe('Completed')
  })

  it('uses JobTable net profit rules', () => {
    expect(rowTableNet(sampleRows[0])).toBe(375)
    const csv = formatJobsDashboardCSV(sampleRows, sampleSummary, {})
    const chloeLine = csv.split('\n').find((line) => line.includes('Chloe Park'))
    const ryanLine = csv.split('\n').find((line) => line.includes('Ryan Moss'))
    expect(chloeLine).toContain('—')
    expect(ryanLine).toContain('$90')
  })
})
