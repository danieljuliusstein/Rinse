'use client'

import type { PLReport } from '@/lib/api/aggregates'
import type { DateRangeKey } from '@/lib/api/reports'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { isLoss } from '@/lib/calculations'
import {
  formatNetProfitLabel,
  formatPercentDelta,
  percentDeltaClass,
  plProgressPeriodLabel,
} from '@/lib/reports-metrics'

interface ReportHeroCardProps {
  report: PLReport
  prior: PLReport
  range: DateRangeKey
}

export default function ReportHeroCard({ report, prior, range }: ReportHeroCardProps) {
  const loss = isLoss(report.netProfit)

  return (
    <div className={`report-hero${loss ? ' report-hero--loss' : ' report-hero--profit'}`}>
      <div className="report-hero-period">{plProgressPeriodLabel(range)}</div>

      <div className="report-hero-rows">
        <div className="report-hero-row">
          <span className="report-hero-row-label">Revenue</span>
          <CurrencyAmount value={report.revenue} variant="revenue" className="report-hero-row-value" />
        </div>
        <div className="report-hero-row">
          <span className="report-hero-row-label">Expenses</span>
          <CurrencyAmount value={report.totalExpenses} variant="expense" unsigned className="report-hero-row-value" />
        </div>
        <div className="report-hero-divider" />
        <div className="report-hero-row report-hero-row--net">
          <span className="report-hero-row-label">{formatNetProfitLabel(report.netProfit)}</span>
          <CurrencyAmount
            value={report.netProfit}
            variant="profit"
            className={`report-hero-net-value${loss ? ' report-hero-net-value--loss' : ''}`}
          />
        </div>
      </div>

      <div className={`report-hero-delta ${percentDeltaClass(report.netProfit, prior.netProfit, 'profit')}`}>
        {formatPercentDelta(report.netProfit, prior.netProfit, range)}
      </div>

      <div className="report-hero-meta">{report.jobCount} job{report.jobCount === 1 ? '' : 's'} in range</div>
    </div>
  )
}
