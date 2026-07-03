'use client'

import { portalMoney } from '@/lib/portal-display'

export default function PortalPayButton({
  token,
  balanceDue,
  businessPhone,
}: {
  token: string
  balanceDue: number
  businessPhone?: string
}) {
  if (balanceDue <= 0) return null

  return (
    <div className="portal-pay-area">
      <a
        href={`/api/portal/${token}/checkout`}
        className="portal-btn-primary portal-btn-primary--link"
      >
        {`Pay ${portalMoney(balanceDue)} online`}
      </a>
      {businessPhone ? (
        <p className="portal-pay-fallback">Or call {businessPhone}</p>
      ) : null}
    </div>
  )
}
