'use client'

import CurrencyAmount from '@/components/ui/CurrencyAmount'
import QrCode from '@/components/ui/QrCode'

export default function PortalPayButton({
  token,
  balanceDue,
  businessPhone,
  appOrigin,
}: {
  token: string
  balanceDue: number
  businessPhone?: string
  appOrigin?: string
}) {
  if (balanceDue <= 0) return null

  const checkoutPath = `/api/portal/${token}/checkout`
  const checkoutUrl =
    typeof window !== 'undefined'
      ? `${appOrigin ?? window.location.origin}${checkoutPath}`
      : checkoutPath

  return (
    <div className="portal-pay-area">
      <a href={checkoutPath} className="portal-btn-primary portal-btn-primary--link">
        Pay <CurrencyAmount value={balanceDue} precision="detailed" variant="neutral" /> online
      </a>
      <QrCode value={checkoutUrl} label="Scan to pay" variant="client" size={140} />
      {businessPhone ? (
        <p className="portal-pay-fallback">Or call {businessPhone}</p>
      ) : null}
    </div>
  )
}
