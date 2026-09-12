'use client'

import { EnvelopeSimple, Phone } from '@phosphor-icons/react'
import { usePortalTheme } from './usePortalTheme'
import PortalHeader from './PortalHeader'
import type { PortalPayload } from '@/lib/server/portal-data'

export type PortalErrorType = 'LINK_EXPIRED' | 'UNAVAILABLE'

export default function PortalErrorScreen({
  type,
  business,
}: {
  type: PortalErrorType
  business?: PortalPayload['business']
}) {
  const title = type === 'LINK_EXPIRED' ? 'This link has expired' : 'Content unavailable'
  const sub =
    type === 'LINK_EXPIRED'
      ? 'Please contact the business for a new secure link.'
      : 'We could not load your information right now. Please try again later or contact the business.'

  const biz = business ?? {
    name: 'Detailing',
    phone: '',
    email: '',
    address: '',
  }

  usePortalTheme(false)

  return (
    <div className="portal-root">
      <PortalHeader business={biz} />
      <div className="portal-error-screen">
        <div className="portal-error-icon" aria-hidden="true">
          !
        </div>
        <h1 className="portal-error-title">{title}</h1>
        <p className="portal-error-sub">{sub}</p>
        <p className="portal-error-code">{type}</p>
        {(biz.phone || biz.email) && (
          <div className="portal-contact-links">
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="portal-contact-link">
                <Phone size={18} className="portal-contact-link__icon" aria-hidden="true" />
                {biz.phone}
              </a>
            )}
            {biz.email && (
              <a href={`mailto:${biz.email}`} className="portal-contact-link">
                <EnvelopeSimple size={18} className="portal-contact-link__icon" aria-hidden="true" />
                {biz.email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
