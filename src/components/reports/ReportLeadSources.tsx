'use client'

import type { CSSProperties } from 'react'
import type { LeadSourceRow } from '@/lib/lead-source-report'
import { fmt } from '@/lib/calculations'

interface ReportLeadSourcesProps {
  rows: LeadSourceRow[]
}

export default function ReportLeadSources({ rows }: ReportLeadSourcesProps) {
  const maxRevenue = rows[0]?.revenue ?? 1

  return (
    <div className="report-card report-lead-sources">
      {rows.map((row) => {
        const pct = Math.round((row.revenue / maxRevenue) * 100)
        return (
          <div key={row.source} className="report-lead-row">
            <div className="report-lead-row-meta">
              <span className="report-lead-row-name">{row.source}</span>
              <span className="report-lead-row-amount">{fmt(row.revenue)}</span>
            </div>
            <div className="report-lead-track">
              <div
                className="report-lead-fill"
                style={{ '--fill-size': `${pct}%` } as CSSProperties}
              />
            </div>
            <div className="report-lead-detail">
              {row.clientCount} client{row.clientCount !== 1 ? 's' : ''} · {row.jobCount} job
              {row.jobCount !== 1 ? 's' : ''} · avg {fmt(row.avgTicket)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
