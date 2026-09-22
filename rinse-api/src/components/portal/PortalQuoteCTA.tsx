'use client'

import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import type { DocumentLocale } from '@rinse/core'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'

function SuccessBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="portal-success-banner">
      <CheckCircle size={28} weight="fill" className="portal-success-banner__icon" aria-hidden="true" />
      <div>
        <div className="portal-success-banner__title">{title}</div>
        <div className="portal-success-banner__sub">{body}</div>
      </div>
    </div>
  )
}

export default function PortalQuoteCTA({
  token,
  businessPhone,
  quoteStatus,
  locale,
}: {
  token: string
  businessPhone?: string
  quoteStatus: string
  locale?: DocumentLocale
}) {
  const s = getDocumentStrings(normalizeDocumentLocale(locale))
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')

  if (accepted || quoteStatus === 'accepted') {
    return <SuccessBanner title={s.estimateAccepted} body={s.estimateAcceptedBody} />
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
          ? `${s.quoteAcceptError} ${s.orCall} ${businessPhone}`
          : s.quoteAcceptError
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
        {accepting ? s.submitting : s.acceptEstimate}
      </button>
      {error && <p className="portal-inline-error">{error}</p>}
    </div>
  )
}
