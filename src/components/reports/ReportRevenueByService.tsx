'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { DateRangeKey } from '@/lib/api/reports'
import { fmtDetailed } from '@/lib/calculations'
import { aggregateJobsRevenue, filterJobsByRange } from '@/lib/jobs-revenue'
import type { JobWithRelations } from '@/lib/types'

interface ReportRevenueByServiceProps {
  jobs: JobWithRelations[]
  range: DateRangeKey
}

export default function ReportRevenueByService({ jobs, range }: ReportRevenueByServiceProps) {
  const [animate, setAnimate] = useState(false)
  const stats = useMemo(() => aggregateJobsRevenue(filterJobsByRange(jobs, range)), [jobs, range])

  useEffect(() => {
    setAnimate(false)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [stats])

  if (stats.services.length === 0) {
    return (
      <div className="report-card report-card--empty report-revenue-breakdown">
        <div className="report-card-empty">No revenue in this period</div>
      </div>
    )
  }

  const max = stats.services[0]?.amount ?? 1

  return (
    <div className="report-card report-revenue-breakdown">
      {stats.services.map((service) => {
        const pct = stats.totalRevenue > 0 ? Math.round((service.amount / stats.totalRevenue) * 100) : 0
        const barPct = max > 0 ? Math.round((service.amount / max) * 100) : 0
        return (
          <div key={service.label} className="report-revenue-row">
            <div className="report-revenue-row-meta">
              <span className="report-revenue-row-label">{service.label}</span>
              <div className="report-revenue-row-right">
                <span className="report-revenue-row-amount">{fmtDetailed(service.amount)}</span>
                <span className="report-revenue-row-pct">{pct}%</span>
              </div>
            </div>
            <div className="report-revenue-track">
              <div
                className="report-revenue-fill"
                style={{ '--fill-size': animate ? `${barPct}%` : '0%' } as CSSProperties}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
