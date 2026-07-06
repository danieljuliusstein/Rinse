'use client'

import Link from 'next/link'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import QrCode from '@/components/ui/QrCode'

export default function PortalPayButton({
  token,
  balanceDue,
  businessPhone,
  businessName,
  appOrigin,
}: {
  token: string
  balanceDue: number
  businessPhone?: string
  businessName?: string
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
      <p className="portal-pay-legal">
        {businessName || 'The Business'} is the merchant of record for this payment. By continuing,
        you agree to the <Link href="/terms/customers">Customer Terms</Link> and{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
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
