'use client'

import { useRouter } from 'next/navigation'
import { Receipt } from '@phosphor-icons/react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import type { ArSummary } from '@/lib/ar-metrics'

interface ArSummaryCardProps {
  summary: ArSummary
  compact?: boolean
  onOverdueClick?: () => void
  onCreateClick?: () => void
}

export default function ArSummaryCard({
  summary,
  compact = false,
  onOverdueClick,
  onCreateClick,
}: ArSummaryCardProps) {
  const router = useRouter()

  if (summary.openCount === 0 && summary.totalInvoiced === 0 && summary.collectedThisMonth === 0) {
    return null
  }

  return (
    <div className={`ar-summary-card${compact ? ' ar-summary-card--compact' : ''}`}>
      <button
        type="button"
        className="ar-summary-card__main"
        onClick={() => router.push('/invoices?filter=open')}
      >
        <span className="ar-summary-card__icon" aria-hidden="true">
          <Receipt size={22} weight="duotone" />
        </span>
        <span className="ar-summary-card__body">
          <span className="ar-summary-card__label">Outstanding</span>
          <span className="ar-summary-card__value">
            <CurrencyAmount value={summary.unpaid} variant="balance" /> unpaid
          </span>
          <span className="ar-summary-card__meta">
            {summary.openCount} open
            {summary.overdueCount > 0 ? ` · ${summary.overdueCount} overdue` : ''}
            {!compact && summary.collectedThisMonth > 0 ? (
              <>
                {' · '}
                <CurrencyAmount value={summary.collectedThisMonth} variant="revenue" /> collected this month
              </>
            ) : null}
          </span>
        </span>
        {!compact && (
          <span className="ar-summary-card__total">
            <span className="ar-summary-card__total-label">Invoiced</span>
            <span className="ar-summary-card__total-value">
              <CurrencyAmount value={summary.totalInvoiced} variant="neutral" />
            </span>
          </span>
        )}
      </button>
      {!compact && (summary.overdueCount > 0 || onCreateClick) ? (
        <div className="ar-summary-card__actions">
          {summary.overdueCount > 0 ? (
            <button
              type="button"
              className="ar-summary-card__action"
              onClick={onOverdueClick ?? (() => router.push('/invoices?filter=overdue'))}
            >
              Overdue ({summary.overdueCount})
            </button>
          ) : null}
          <button
            type="button"
            className="ar-summary-card__action ar-summary-card__action--primary"
            onClick={onCreateClick ?? (() => router.push('/invoices/new'))}
          >
            Create invoice
          </button>
        </div>
      ) : null}
    </div>
  )
}
