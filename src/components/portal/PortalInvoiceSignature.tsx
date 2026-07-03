'use client'

import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import PortalSignaturePad from './PortalSignaturePad'

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PortalInvoiceSignature({
  token,
  signatureUrl: initialUrl,
  signedAt: initialSignedAt,
}: {
  token: string
  signatureUrl?: string
  signedAt?: string
}) {
  const [signatureUrl, setSignatureUrl] = useState(initialUrl)
  const [signedAt, setSignedAt] = useState(initialSignedAt)

  if (signatureUrl) {
    return (
      <div className="portal-signature portal-signature--done">
        <div className="portal-signature__done-head">
          <CheckCircle size={18} weight="fill" className="portal-signature__done-icon" aria-hidden="true" />
          <span>Signed{signedAt ? ` · ${formatSignedAt(signedAt)}` : ''}</span>
        </div>
        <img src={signatureUrl} alt="Client signature" className="portal-signature__image" />
      </div>
    )
  }

  return (
    <PortalSignaturePad
      onSubmit={async (dataUrl) => {
        const res = await fetch(`/api/portal/${token}/sign-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureUrl: dataUrl }),
        })
        const data = (await res.json()) as { error?: string; signedAt?: string }
        if (!res.ok) throw new Error(data.error ?? 'Could not save signature')
        setSignatureUrl(dataUrl)
        setSignedAt(data.signedAt ?? new Date().toISOString())
      }}
    />
  )
}
