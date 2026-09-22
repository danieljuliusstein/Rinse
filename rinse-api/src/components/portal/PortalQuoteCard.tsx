import type { DocumentLocale } from '@rinse/core'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'
import type { PortalPayload } from '@/lib/server/portal-data'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  capitalize,
  formatPortalDateShort,
  portalQuoteBadgeClass,
} from '@/lib/portal-display'

export default function PortalQuoteCard({
  quote,
  locale,
}: {
  quote: NonNullable<PortalPayload['quote']>
  locale?: DocumentLocale
}) {
  const s = getDocumentStrings(normalizeDocumentLocale(locale))

  return (
    <div className="portal-quote-hero">
      <div className="portal-quote-hero__header">
        <div>
          <div className="portal-quote-number">{quote.quoteNumber}</div>
          <div className="portal-quote-price">
            <CurrencyAmount value={quote.subtotal} precision="detailed" variant="revenue" />
          </div>
          <div className="portal-quote-pkg">
            {quote.packageName} · {capitalize(quote.vehicleType)}
          </div>
        </div>
        <span className={portalQuoteBadgeClass(quote.status)}>
          {quote.status === 'accepted' ? s.statusAccepted.toUpperCase() : quote.status.toUpperCase()}
        </span>
      </div>

      <div className="portal-quote-meta">
        <div className="portal-meta-chip">
          <span className="portal-meta-chip__label">{s.proposedDate}</span>
          {formatPortalDateShort(quote.date)}
        </div>
        {quote.validUntil && (
          <div className="portal-meta-chip">
            <span className="portal-meta-chip__label">{s.validUntil}</span>
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
