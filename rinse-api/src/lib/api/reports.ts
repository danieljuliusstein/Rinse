import { rangeDateSpanLabel, rangePeriodLabel } from '../jobs-revenue'
import {
  computeJobsCSV,
  computePLReport,
  computePLReportForDates,
  priorRangeFor,
  rangeFor,
  type PLReport,
} from './aggregates'
import { getBusinessExpenses } from './business-expenses-local'
import { getOverheadExpenses } from './overhead-local'
import { businessExpensesTotalForDates } from '../business-expenses-logic'
import { overheadAmountForDates } from '../supplies-logic'
import { loadSettings } from '../settings'
import { loadData } from '../storage'
import type { Job } from '../types'

export type DateRangeKey = 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'lifetime'
export type { PLReport } from './aggregates'

export interface PLReportBundle {
  current: PLReport
  prior: PLReport
}

export function getPLReportFromJobs(jobs: Job[], range: DateRangeKey): PLReport {
  const overheadItems = getOverheadExpenses()
  const businessItems = getBusinessExpenses()
  const { start, end } = rangeFor(range)
  const overhead = overheadAmountForDates(overheadItems, start, end)
  const business = businessExpensesTotalForDates(businessItems, start, end)
  return computePLReport(jobs, range, overhead, business)
}

export function getPLReportBundleFromJobs(jobs: Job[], range: DateRangeKey): PLReportBundle {
  const overheadItems = getOverheadExpenses()
  const businessItems = getBusinessExpenses()
  const { start, end } = rangeFor(range)
  const prior = priorRangeFor(range)
  const currentOverhead = overheadAmountForDates(overheadItems, start, end)
  const priorOverhead = overheadAmountForDates(overheadItems, prior.start, prior.end)
  const currentBusiness = businessExpensesTotalForDates(businessItems, start, end)
  const priorBusiness = businessExpensesTotalForDates(businessItems, prior.start, prior.end)
  return {
    current: computePLReportForDates(jobs, start, end, currentOverhead, currentBusiness),
    prior: computePLReportForDates(jobs, prior.start, prior.end, priorOverhead, priorBusiness),
  }
}

export function getPLReportLifetimeBundle(jobs: Job[]): PLReportBundle {
  const sorted = [...jobs].sort((a, b) => a.date.localeCompare(b.date))
  const startIso = sorted[0]?.date ?? '2000-01-01'
  const endIso = new Date().toISOString().slice(0, 10)
  return getPLReportBundleForDates(jobs, startIso, endIso)
}

export function getPLReportBundleForDates(jobs: Job[], startIso: string, endIso: string): PLReportBundle {
  const overheadItems = getOverheadExpenses()
  const businessItems = getBusinessExpenses()
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T23:59:59`)
  const spanMs = end.getTime() - start.getTime()
  const priorEnd = new Date(start.getTime() - 1)
  const priorStart = new Date(priorEnd.getTime() - spanMs)

  const currentOverhead = overheadAmountForDates(overheadItems, start, end)
  const priorOverhead = overheadAmountForDates(overheadItems, priorStart, priorEnd)
  const currentBusiness = businessExpensesTotalForDates(businessItems, start, end)
  const priorBusiness = businessExpensesTotalForDates(businessItems, priorStart, priorEnd)

  return {
    current: computePLReportForDates(jobs, start, end, currentOverhead, currentBusiness),
    prior: computePLReportForDates(jobs, priorStart, priorEnd, priorOverhead, priorBusiness),
  }
}

export function exportJobsCSVFromJobs(jobs: Job[], range: DateRangeKey): string {
  const data = loadData()
  return computeJobsCSV(jobs, range, (job) => ({
    client: data.clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: data.packages.find((p) => p.id === job.package_id)?.name ?? '',
  }), {
    periodLabel: rangePeriodLabel(range),
    periodRange: rangeDateSpanLabel(range),
    businessName: loadSettings().business_name,
  })
}

/** @deprecated Use getPLReport from api/index — kept for local fallback */
export function getPLReport(range: DateRangeKey) {
  const data = loadData()
  return computePLReport(data.jobs, range)
}

/** @deprecated Use exportJobsCSV from api/index */
export function exportJobsCSV(range: DateRangeKey): string {
  const data = loadData()
  return computeJobsCSV(data.jobs, range, (job) => ({
    client: data.clients.find((c) => c.id === job.client_id)?.name ?? '',
    pkg: data.packages.find((p) => p.id === job.package_id)?.name ?? '',
  }), {
    periodLabel: rangePeriodLabel(range),
    periodRange: rangeDateSpanLabel(range),
    businessName: loadSettings().business_name,
  })
}
