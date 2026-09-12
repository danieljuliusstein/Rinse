import Link from 'next/link'
import type { Metadata } from 'next'

import CustomerTerms from '@/lib/legal/customer-terms'
import { LEGAL_UPDATED } from '@/lib/legal/constants'
import { buildSupportMailto, getSupportEmail } from '@/lib/support-config'

export const metadata: Metadata = {
  title: 'End-Customer Terms',
}

export default function CustomerTermsPage() {
  const supportEmail = getSupportEmail()
  const supportMailto = buildSupportMailto({ subject: 'Rinse support' })

  return (
    <div className="screen page-content legal-page client-light-root">
      <header className="legal-page__header">
        <Link href="/" className="legal-page__back">
          ← Back
        </Link>
        <h1 className="legal-page__title">End-Customer Terms of Use</h1>
        <p className="legal-page__updated">Last updated {LEGAL_UPDATED}</p>
      </header>

      <div className="legal-page__body rinse-prose">
        <CustomerTerms supportEmail={supportEmail} supportMailto={supportMailto} />
      </div>
    </div>
  )
}
