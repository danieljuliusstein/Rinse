export interface JobExportRow {
  date: string
  client: string
  pkg: string
  revenue: number
  tip: number
  expenses: number
  netProfit: number
  status: string
}

export interface JobExportSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  jobCount: number
}

export interface JobsDashboardCSVOptions {
  businessName?: string
  periodLabel?: string
  periodRange?: string
  /** @deprecated Not shown in dashboard CSV — kept for API compat */
  priorRevenue?: number
}

function csvField(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Matches JobsDashboard `fmt`: whole dollars, no cents. */
export function formatDashboardMoney(n: number): string {
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  )
}

function formatCsvDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Dashboard table status labels (JobsDashboard / StatusPill). */
export function csvJobStatusLabel(raw: string): string {
  switch (raw) {
    case 'scheduled':
      return 'Scheduled'
    case 'in_progress':
      return 'Pending'
    case 'completed':
    case 'invoiced':
    case 'paid':
      return 'Completed'
    default:
      return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ')
  }
}

export function isCompletedJobStatus(raw: string): boolean {
  return raw === 'completed' || raw === 'invoiced' || raw === 'paid'
}

function isScheduledJobStatus(raw: string): boolean {
  return raw === 'scheduled'
}

/** JobTable net profit: revenue + tip − expenses */
export function rowTableNet(row: JobExportRow): number {
  return row.revenue + row.tip - row.expenses
}

function formatTipCell(tip: number): string {
  return tip > 0 ? formatDashboardMoney(tip) : '—'
}

function formatNetProfitCell(row: JobExportRow): string {
  if (isScheduledJobStatus(row.status)) return '—'
  return formatDashboardMoney(rowTableNet(row))
}

interface DashboardKpis {
  revenue: number
  tips: number
  expenses: number
  netProfit: number
  margin: number
  jobCount: number
  completed: number
  avgTip: number
}

/**
 * KPI math from JobsDashboard.jsx:
 * - revenue: all jobs
 * - tips / expenses: completed jobs only
 * - netProfit: revenue + tips − expenses
 * - margin: netProfit / revenue
 * - avg tip: tips / completed count
 */
export function computeDashboardKpis(rows: JobExportRow[]): DashboardKpis {
  const completed = rows.filter((r) => isCompletedJobStatus(r.status))
  const revenue = rows.reduce((s, r) => s + r.revenue, 0)
  const tips = completed.reduce((s, r) => s + r.tip, 0)
  const expenses = completed.reduce((s, r) => s + r.expenses, 0)
  const netProfit = revenue + tips - expenses
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0
  const avgTip = completed.length > 0 ? Math.round(tips / completed.length) : 0

  return {
    revenue,
    tips,
    expenses,
    netProfit,
    margin,
    jobCount: rows.length,
    completed: completed.length,
    avgTip,
  }
}

/** Completed jobs only; revenue column (not tips). */
function buildPackageBreakdown(rows: JobExportRow[]) {
  const completed = rows.filter((r) => isCompletedJobStatus(r.status))
  const byPkg = new Map<string, number>()
  for (const row of completed) {
    const label = row.pkg.trim() || 'Other'
    byPkg.set(label, (byPkg.get(label) ?? 0) + row.revenue)
  }
  const entries = [...byPkg.entries()].sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, amt]) => s + amt, 0)
  return entries.map(([label, amount]) => ({
    label,
    amount,
    share: total > 0 ? Math.round((amount / total) * 100) : 0,
  }))
}

/** Completed jobs only; revenue per day. */
function buildDailyRevenue(rows: JobExportRow[]) {
  const completed = rows.filter((r) => isCompletedJobStatus(r.status))
  const byDate = new Map<string, number>()
  for (const row of completed) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.revenue)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }))
}

/**
 * CSV layout aligned with JobsDashboard.jsx + JobTable.jsx:
 * header → KPIs → package donut data → daily revenue → jobs table.
 */
export function formatJobsDashboardCSV(
  rows: JobExportRow[],
  _summary: JobExportSummary,
  options: JobsDashboardCSVOptions = {}
): string {
  const sortedRows = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const kpis = computeDashboardKpis(sortedRows)
  const business = options.businessName?.trim() || 'Rinse'
  const period = options.periodLabel?.trim() || 'This month'
  const periodRange = options.periodRange?.trim() || period
  const generated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const revenueNote = kpis.jobCount === 0 ? 'No jobs yet' : ''

  const lines: string[] = [
    csvField(`${business} — Jobs overview`),
    [csvField('Period'), csvField(period)].join(','),
    [csvField('Date range'), csvField(periodRange)].join(','),
    [csvField('Generated'), csvField(generated)].join(','),
    '',
    csvField('KEY METRICS'),
    [csvField('Metric'), csvField('Value'), csvField('Notes')].join(','),
    [
      csvField('Revenue'),
      csvField(formatDashboardMoney(kpis.revenue)),
      csvField(revenueNote),
    ].join(','),
    [
      csvField('Net profit'),
      csvField(formatDashboardMoney(kpis.netProfit)),
      csvField(`${kpis.margin}% margin`),
    ].join(','),
    [
      csvField('Jobs'),
      csvField(kpis.jobCount),
      csvField(`${kpis.completed} completed`),
    ].join(','),
    [
      csvField('Tips'),
      csvField(formatDashboardMoney(kpis.tips)),
      csvField(kpis.completed > 0 ? `${formatDashboardMoney(kpis.avgTip)} avg` : ''),
    ].join(','),
    [csvField('Expenses'), csvField(formatDashboardMoney(kpis.expenses)), csvField('')].join(','),
    '',
    csvField('REVENUE BY PACKAGE'),
    [csvField('Package'), csvField('Revenue'), csvField('Share')].join(','),
  ]

  const packages = buildPackageBreakdown(sortedRows)
  if (packages.length === 0) {
    lines.push([csvField('—'), csvField(formatDashboardMoney(0)), csvField('0%')].join(','))
  } else {
    for (const pkg of packages) {
      lines.push(
        [
          csvField(pkg.label),
          csvField(formatDashboardMoney(pkg.amount)),
          csvField(`${pkg.share}%`),
        ].join(',')
      )
    }
  }

  lines.push('', csvField('DAILY REVENUE'), [csvField('Date'), csvField('Revenue')].join(','))
  const daily = buildDailyRevenue(sortedRows)
  if (daily.length === 0) {
    lines.push([csvField('—'), csvField(formatDashboardMoney(0))].join(','))
  } else {
    for (const day of daily) {
      lines.push(
        [csvField(formatCsvDate(day.date)), csvField(formatDashboardMoney(day.revenue))].join(',')
      )
    }
  }

  lines.push(
    '',
    csvField('ALL JOBS'),
    ['Date', 'Client', 'Package', 'Status', 'Revenue', 'Tip', 'Net profit'].map(csvField).join(',')
  )

  if (sortedRows.length === 0) {
    lines.push(
      [
        csvField('—'),
        csvField('No jobs in this period'),
        csvField(''),
        csvField(''),
        csvField(formatDashboardMoney(0)),
        csvField('—'),
        csvField('—'),
      ].join(',')
    )
  } else {
    for (const row of sortedRows) {
      lines.push(
        [
          formatCsvDate(row.date),
          row.client,
          row.pkg,
          csvJobStatusLabel(row.status),
          formatDashboardMoney(row.revenue),
          formatTipCell(row.tip),
          formatNetProfitCell(row),
        ]
          .map(csvField)
          .join(',')
      )
    }
  }

  return lines.join('\n')
}
