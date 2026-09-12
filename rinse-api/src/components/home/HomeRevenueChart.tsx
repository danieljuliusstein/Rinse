'use client'

import { useMemo } from 'react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  aggregateJobsRevenue,
  donutArcPath,
  filterJobsByRange,
  type ServiceSlice,
} from '@/lib/jobs-revenue'
import type { JobWithRelations } from '@/lib/types'

interface HomeRevenueChartProps {
  jobs: JobWithRelations[]
}

const CX = 54
const CY = 54
const OUTER = 48
const INNER = 30

function DonutSlice({ slice, startAngle, endAngle }: { slice: ServiceSlice; startAngle: number; endAngle: number }) {
  return (
    <path
      d={donutArcPath(CX, CY, OUTER, INNER, startAngle, endAngle)}
      fill={slice.color}
      stroke="var(--bg-card)"
      strokeWidth={1}
    />
  )
}

export default function HomeRevenueChart({ jobs }: HomeRevenueChartProps) {
  const monthJobs = useMemo(() => filterJobsByRange(jobs, 'this_month'), [jobs])
  const stats = useMemo(() => aggregateJobsRevenue(monthJobs), [monthJobs])

  const slices = useMemo(() => {
    if (stats.totalRevenue <= 0) return []
    let angle = -Math.PI / 2
    return stats.services.map((slice) => {
      const sweep = (slice.amount / stats.totalRevenue) * Math.PI * 2
      const start = angle
      angle += sweep
      return { slice, startAngle: start, endAngle: angle }
    })
  }, [stats])

  if (stats.jobCount === 0) return null

  return (
    <div className="home-revenue-chart card">
      <div className="home-revenue-chart__head">
        <p className="home-revenue-chart__title">Service mix</p>
        <p className="home-revenue-chart__meta">
          <CurrencyAmount value={stats.totalRevenue} variant="revenue" /> this month
        </p>
      </div>
      <div className="home-revenue-chart__body">
        <svg viewBox="0 0 108 108" className="home-revenue-chart__svg" aria-hidden="true">
          {slices.map(({ slice, startAngle, endAngle }) => (
            <DonutSlice key={slice.label} slice={slice} startAngle={startAngle} endAngle={endAngle} />
          ))}
          <circle cx={CX} cy={CY} r={INNER - 1} fill="var(--bg-card)" />
        </svg>
        <ul className="home-revenue-chart__legend">
          {stats.services.slice(0, 4).map((s) => (
            <li key={s.label}>
              <span className="home-revenue-chart__swatch" style={{ background: s.color }} />
              <span className="home-revenue-chart__label">{s.label}</span>
              <span className="home-revenue-chart__amount">
                <CurrencyAmount value={s.amount} variant="neutral" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
