'use client'

import { useSearchParams } from 'next/navigation'
import type { PortalPayload } from '@/lib/server/portal-data'
import type { PortalScope } from '@/lib/portal-client'
import { brandCssVars } from '@/lib/brand-color'
import PortalFooter from './PortalFooter'
import PortalPhotosFooter from './PortalPhotosFooter'
import { usePortalTheme } from './usePortalTheme'
import PortalGreetingCard from './PortalGreetingCard'
import PortalHeader from './PortalHeader'
import PortalInvoiceCard from './PortalInvoiceCard'
import PortalPhotoGrid from './PortalPhotoGrid'
import PortalQuoteCard from './PortalQuoteCard'
import PortalQuoteCTA from './PortalQuoteCTA'
import PortalServiceCard from './PortalServiceCard'
import { capitalize, formatPortalDate } from '@/lib/portal-display'

interface PortalViewProps {
  payload: PortalPayload
  token: string
}

function showInvoice(scope: PortalScope, invoice?: PortalPayload['invoice']) {
  return !!invoice && (scope === 'invoice' || scope === 'full' || scope === 'job')
}

function showPhotos(scope: PortalScope, photos: PortalPayload['photos']) {
  return photos.length > 0 && (scope === 'photos' || scope === 'full' || scope === 'job')
}

function showJob(scope: PortalScope, job?: PortalPayload['job']) {
  return !!job && scope !== 'quote' && scope !== 'invoice' && scope !== 'photos'
}

function showQuote(scope: PortalScope, quote?: PortalPayload['quote']) {
  return !!quote && (scope === 'quote' || scope === 'full')
}

export default function PortalView({ payload, token }: PortalViewProps) {
  const searchParams = useSearchParams()
  const paymentReceived = searchParams.get('paid') === '1'
  const payError = searchParams.get('pay_error')
  const { scope, business, client, job, invoice, quote, photos } = payload
  const isPhotosScope = scope === 'photos'
  usePortalTheme(isPhotosScope)
  const before = photos.filter((p) => p.type === 'before')
  const after = photos.filter((p) => p.type === 'after')

  const greetingSub = job
    ? `${capitalize(job.vehicleType)} · ${job.locationType === 'mobile' ? 'Mobile detail' : 'Shop detail'} · ${formatPortalDate(job.date)}`
    : quote
      ? `${quote.packageName} · ${capitalize(quote.vehicleType)}`
      : invoice
        ? `Invoice ${invoice.invoiceNumber}`
        : undefined

  return (
    <div
      className={`portal-root client-light-root${isPhotosScope ? ' portal-root--photos' : ''}`}
      style={brandCssVars(business.accentColor)}
    >
      <PortalHeader business={business} />

      <div className="portal-body">
        {isPhotosScope && (
          <div>
            <div className="portal-photos-hero-title">Your detail photos</div>
            <div className="portal-photos-hero-sub">
              {job
                ? `${job.packageName} · ${formatPortalDate(job.date)}`
                : client.name
                  ? `Prepared for ${client.name}`
                  : 'Before & after from your detail'}
            </div>
          </div>
        )}

        {!isPhotosScope && (
          <PortalGreetingCard clientName={client.name} subtitle={greetingSub} />
        )}

        {paymentReceived && (
          <div className="portal-success-banner portal-flash">
            <div>
              <div className="portal-success-banner__title">Payment received</div>
              <div className="portal-success-banner__sub">Thank you — your payment is being processed.</div>
            </div>
          </div>
        )}

        {payError && (
          <p className="portal-inline-error portal-flash">
            {payError}
          </p>
        )}

        {showQuote(scope, quote) && quote && <PortalQuoteCard quote={quote} />}

        {showQuote(scope, quote) && quote && (
          <PortalQuoteCTA
            token={token}
            businessPhone={business.phone}
            quoteStatus={quote.status}
          />
        )}

        {showJob(scope, job) && job && !isPhotosScope && <PortalServiceCard job={job} />}

        {showInvoice(scope, invoice) && invoice && (
          <PortalInvoiceCard
            invoice={invoice}
            job={job}
            token={token}
            showPayOnline={scope === 'invoice' || scope === 'full'}
            businessPhone={business.phone}
            businessName={business.name}
          />
        )}

        {showPhotos(scope, photos) && (
          <>
            <PortalPhotoGrid label="Before" photos={before} dark={isPhotosScope} />
            <PortalPhotoGrid label="After" photos={after} dark={isPhotosScope} after />
          </>
        )}
      </div>

      {isPhotosScope ? (
        <PortalPhotosFooter business={business} />
      ) : (
        <PortalFooter business={business} />
      )}
    </div>
  )
}
