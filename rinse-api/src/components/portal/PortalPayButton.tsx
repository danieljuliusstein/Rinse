'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DocumentLocale } from '@rinse/core'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import QrCode from '@/components/ui/QrCode'
import PortalTipSelector from './PortalTipSelector'

export default function PortalPayButton({
  token,
  balanceDue,
  businessPhone,
  businessName,
  appOrigin,
  locale,
}: {
  token: string
  balanceDue: number
  businessPhone?: string
  businessName?: string
  appOrigin?: string
  locale?: DocumentLocale
}) {
  const s = getDocumentStrings(normalizeDocumentLocale(locale))
  const [tipAmount, setTipAmount] = useState(0)

  if (balanceDue <= 0) return null

  const totalToPay = Math.round((balanceDue + tipAmount) * 100) / 100
  const tipQuery = tipAmount > 0 ? `?tip=${tipAmount.toFixed(2)}` : ''
  const checkoutPath = `/api/portal/${token}/checkout${tipQuery}`
  const checkoutUrl =
    typeof window !== 'undefined'
      ? `${appOrigin ?? window.location.origin}${checkoutPath}`
      : checkoutPath

  return (
    <div className="portal-pay-area">
      <PortalTipSelector
        balanceDue={balanceDue}
        tipAmount={tipAmount}
        onChangeTip={setTipAmount}
      />

      <p className="portal-pay-legal">
        {businessName || 'The Business'} {s.merchantOfRecord} <Link href="/terms/customers">{s.customerTerms}</Link> {s.andConjunction}{' '}
        <Link href="/privacy">{s.privacyPolicy}</Link>.
      </p>
      <a href={checkoutPath} className="portal-btn-primary portal-btn-primary--link">
        {s.payOnline} <CurrencyAmount value={totalToPay} precision="detailed" variant="neutral" />
      </a>
      <QrCode value={checkoutUrl} label={s.scanToPay} variant="client" size={140} />
      {businessPhone ? (
        <p className="portal-pay-fallback">{s.orCall} {businessPhone}</p>
      ) : null}
    </div>
  )
}
