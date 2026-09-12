'use client'

import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'

function SuccessBanner() {
  return (
    <div className="portal-success-banner">
      <CheckCircle size={28} weight="fill" className="portal-success-banner__icon" aria-hidden="true" />
      <div>
        <div className="portal-success-banner__title">Estimate accepted</div>
        <div className="portal-success-banner__sub">We&apos;ll be in touch to confirm your date.</div>
      </div>
    </div>
  )
}

export default function PortalQuoteCTA({
  token,
  businessPhone,
  quoteStatus,
}: {
  token: string
  businessPhone?: string
  quoteStatus: string
}) {
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')

  if (accepted || quoteStatus === 'accepted') {
    return <SuccessBanner />
  }

  if (quoteStatus !== 'sent') return null

  const handleAccept = async () => {
    setAccepting(true)
    setError('')
    try {
      const res = await fetch(`/api/portal/${token}/accept-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAccepted(true)
    } catch {
      setError(
        businessPhone
          ? `Something went wrong — call us at ${businessPhone}`
          : 'Something went wrong — please contact the business.'
      )
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div id="quote-cta-area">
      <button
        type="button"
        className="portal-btn-primary"
        data-action="accept-estimate"
        disabled={accepting}
        onClick={handleAccept}
      >
        {accepting ? 'Submitting…' : 'Accept estimate'}
      </button>
      {error && <p className="portal-inline-error">{error}</p>}
    </div>
  )
}
