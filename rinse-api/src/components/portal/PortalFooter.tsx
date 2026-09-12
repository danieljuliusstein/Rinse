import Link from 'next/link'
import type { PortalPayload } from '@/lib/server/portal-data'

export default function PortalFooter({ business }: { business: PortalPayload['business'] }) {
  return (
    <footer className="portal-footer">
      {business.termsFooter && <p className="portal-footer-text">{business.termsFooter}</p>}
      <div className="portal-footer-contact">
        {business.email && <div>{business.email}</div>}
        {business.address && <div>{business.address}</div>}
        {business.phone && <div>{business.phone}</div>}
      </div>
      <p className="portal-footer-legal">
        <Link href="/terms/customers">Customer Terms</Link>
        {' · '}
        <Link href="/privacy">Privacy Policy</Link>
      </p>
    </footer>
  )
}
