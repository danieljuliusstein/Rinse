'use client'

import { useState } from 'react'
import type { PortalPayload } from '@/lib/server/portal-data'

const DEFAULT_LOGO = '/api/business-logo'

export default function PortalHeader({ business }: { business: PortalPayload['business'] }) {
  const initialSrc = business.logoUrl || DEFAULT_LOGO
  const [logoSrc, setLogoSrc] = useState(initialSrc)

  const handleError = () => {
    if (!logoSrc.endsWith('/logo.png')) setLogoSrc('/logo.png')
  }

  return (
    <header className="portal-header">
      <div className="portal-biz-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" onError={handleError} />
      </div>
      <div className="portal-biz-info">
        <div className="portal-biz-name">{business.name}</div>
        {business.phone && <div className="portal-biz-phone">{business.phone}</div>}
      </div>
    </header>
  )
}
