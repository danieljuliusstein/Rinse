import Link from 'next/link'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'
import type { PortalPayload } from '@/lib/server/portal-data'

export default function PortalPhotosFooter({ business }: { business: PortalPayload['business'] }) {
  const s = getDocumentStrings(normalizeDocumentLocale(business.locale))
  const hasContact = !!(business.phone || business.email)
  if (!hasContact && !business.termsFooter) return null

  return (
    <footer className="portal-photos-footer">
      {business.termsFooter && <p className="portal-photos-footer__text">{business.termsFooter}</p>}
      {hasContact && (
        <div className="portal-photos-footer__contact">
          {business.phone && <div>{business.phone}</div>}
          {business.email && <div>{business.email}</div>}
        </div>
      )}
      <p className="portal-photos-footer__legal">
        <Link href="/terms/customers">{s.customerTerms}</Link>
        {' · '}
        <Link href="/privacy">{s.privacyPolicy}</Link>
      </p>
    </footer>
  )
}
