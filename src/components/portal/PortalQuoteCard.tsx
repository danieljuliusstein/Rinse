import type { PortalPayload } from '@/lib/server/portal-data'
import {
  capitalize,
  formatPortalDateShort,
  portalMoney,
  portalQuoteBadgeClass,
} from '@/lib/portal-display'

export default function PortalQuoteCard({ quote }: { quote: NonNullable<PortalPayload['quote']> }) {
  return (
    <div className="portal-quote-hero">
      <div className="portal-quote-hero__header">
        <div>
          <div className="portal-quote-number">{quote.quoteNumber}</div>
          <div className="portal-quote-price">{portalMoney(quote.subtotal)}</div>
          <div className="portal-quote-pkg">
            {quote.packageName} · {capitalize(quote.vehicleType)}
          </div>
        </div>
        <span className={portalQuoteBadgeClass(quote.status)}>
          {quote.status === 'accepted' ? 'ACCEPTED' : quote.status.toUpperCase()}
        </span>
      </div>

      <div className="portal-quote-meta">
        <div className="portal-meta-chip">
          <span className="portal-meta-chip__label">Proposed</span>
          {formatPortalDateShort(quote.date)}
        </div>
        {quote.validUntil && (
          <div className="portal-meta-chip">
            <span className="portal-meta-chip__label">Valid until</span>
            {formatPortalDateShort(quote.validUntil)}
          </div>
        )}
      </div>

      {quote.notes && (
        <div className="portal-notes-block portal-notes-block--spaced">
          {quote.notes}
        </div>
      )}
    </div>
  )
}
