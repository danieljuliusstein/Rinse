import type { JobWithRelations } from '@rinse/core'
import { activeJobs, netProfit } from '@rinse/core'
import { rangeFor, jobInRange as reportJobInRange, type DateRangeKey } from './reports'

export const SERVICE_COLORS: Record<string, string> = {
  'Paint Correction': '#5b9cf6',
  'Ceramic Coat': '#22c55e',
  'Full Detail': '#f5a623',
  'Basic Wash': '#a78bfa',
}

const FALLBACK_COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#c084fc', '#fb7185']

export interface ServiceSlice {
  label: string
  amount: number
  color: string
}

export interface JobsRevenueStats {
  totalRevenue: number
  totalProfit: number
  jobCount: number
  avgJobValue: number
  margin: number
  services: ServiceSlice[]
}

function colorForService(label: string, index: number): string {
  return SERVICE_COLORS[label] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function filterJobsByRange(jobs: JobWithRelations[], range: DateRangeKey): JobWithRelations[] {
  const { start, end } = rangeFor(range)
  // Exclude cancelled jobs so job-based revenue never counts cancelled work
  // (Requirements 1.1/1.2). activeJobs is the shared @rinse/core guard.
  return activeJobs(jobs).filter((j) => reportJobInRange(j, start, end))
}

export function aggregateJobsRevenue(jobs: JobWithRelations[]): JobsRevenueStats {
  const byService = new Map<string, number>()
  let totalRevenue = 0
  let totalProfit = 0

  // Authoritative cancelled-job exclusion for job-based revenue: sum
  // `revenue + tip` over non-cancelled jobs only (Requirements 1.1/3.1).
  const active = activeJobs(jobs)
  for (const job of active) {
    const amount = job.revenue + job.tip
    const label = job.package?.name?.trim() || 'Other'
    byService.set(label, (byService.get(label) ?? 0) + amount)
    totalRevenue += amount
    totalProfit += netProfit(job)
  }

  const services: ServiceSlice[] = [...byService.entries()]
    .map(([label, amount], index) => ({
      label,
      amount,
      color: colorForService(label, index),
    }))
    .sort((a, b) => b.amount - a.amount)

  const jobCount = active.length
  const avgJobValue = jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  return { totalRevenue, totalProfit, jobCount, avgJobValue, margin, services }
}

function fullDonutPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const topOuter = { x: cx, y: cy - outerR }
  const bottomOuter = { x: cx, y: cy + outerR }
  const topInner = { x: cx, y: cy - innerR }
  const bottomInner = { x: cx, y: cy + innerR }

  return [
    `M ${topOuter.x} ${topOuter.y}`,
    `A ${outerR} ${outerR} 0 1 1 ${bottomOuter.x} ${bottomOuter.y}`,
    `A ${outerR} ${outerR} 0 1 1 ${topOuter.x} ${topOuter.y}`,
    `L ${topInner.x} ${topInner.y}`,
    `A ${innerR} ${innerR} 0 1 0 ${bottomInner.x} ${bottomInner.y}`,
    `A ${innerR} ${innerR} 0 1 0 ${topInner.x} ${topInner.y}`,
    'Z',
  ].join(' ')
}

export function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const sweep = endAngle - startAngle
  if (sweep >= Math.PI * 2 - 1e-6) {
    return fullDonutPath(cx, cy, outerR, innerR)
  }

  const largeArc = sweep > Math.PI ? 1 : 0
  const ox1 = cx + outerR * Math.cos(startAngle)
  const oy1 = cy + outerR * Math.sin(startAngle)
  const ox2 = cx + outerR * Math.cos(endAngle)
  const oy2 = cy + outerR * Math.sin(endAngle)
  const ix2 = cx + innerR * Math.cos(endAngle)
  const iy2 = cy + innerR * Math.sin(endAngle)
  const ix1 = cx + innerR * Math.cos(startAngle)
  const iy1 = cy + innerR * Math.sin(startAngle)

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}
