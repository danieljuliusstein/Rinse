'use client'

import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import type { DocumentLocale } from '@rinse/core'
import {
  getDocumentStrings,
  intlLocaleForDocument,
  normalizeDocumentLocale,
} from '@rinse/core'
import PortalSignaturePad from './PortalSignaturePad'

function formatSignedAt(iso: string, localeTag = 'en-US'): string {
  return new Date(iso).toLocaleDateString(localeTag, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PortalInvoiceSignature({
  token,
  signatureUrl: initialUrl,
  signedAt: initialSignedAt,
  locale,
}: {
  token: string
  signatureUrl?: string
  signedAt?: string
  locale?: DocumentLocale
}) {
  const normLocale = normalizeDocumentLocale(locale)
  const s = getDocumentStrings(normLocale)
  const localeTag = intlLocaleForDocument(normLocale)
  const [signatureUrl, setSignatureUrl] = useState(initialUrl)
  const [signedAt, setSignedAt] = useState(initialSignedAt)

  if (signatureUrl) {
    return (
      <div className="portal-signature portal-signature--done">
        <div className="portal-signature__done-head">
          <CheckCircle size={18} weight="fill" className="portal-signature__done-icon" aria-hidden="true" />
          <span>{s.signed}{signedAt ? ` · ${formatSignedAt(signedAt, localeTag)}` : ''}</span>
        </div>
        <img src={signatureUrl} alt={s.client} className="portal-signature__image" />
      </div>
    )
  }

  return (
    <PortalSignaturePad
      locale={locale}
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
