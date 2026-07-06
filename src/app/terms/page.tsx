import Link from 'next/link'
import type { Metadata } from 'next'

import { LEGAL_UPDATED, getLegalEntityName } from '@/lib/legal/constants'
import OperatorTerms from '@/lib/legal/operator-terms'
import {
  buildLegalMailto,
  buildSupportMailto,
  getLegalEmail,
  getSupportEmail,
} from '@/lib/support-config'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  const legalEntityName = getLegalEntityName()
  const legalEmail = getLegalEmail()
  const supportEmail = getSupportEmail()
  const legalMailto = buildLegalMailto()
  const supportMailto = buildSupportMailto({ subject: 'Rinse support' })

  return (
    <div className="screen page-content legal-page client-light-root">
      <header className="legal-page__header">
        <Link href="/settings" className="legal-page__back">
          ← Settings
        </Link>
        <h1 className="legal-page__title">Terms of Service</h1>
        <p className="legal-page__updated">Last updated {LEGAL_UPDATED}</p>
      </header>

      <div className="legal-page__body rinse-prose">
        <OperatorTerms
          legalEntityName={legalEntityName}
          legalEmail={legalEmail}
          supportEmail={supportEmail}
          legalMailto={legalMailto}
          supportMailto={supportMailto}
        />
      </div>
    </div>
  )
}
