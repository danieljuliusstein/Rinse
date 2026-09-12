import Link from 'next/link'
import type { Metadata } from 'next'
import { APP_DISPLAY_NAME, SUPPORT_FAQ } from '@/lib/support-config'

export const metadata: Metadata = {
  title: 'FAQ',
}

export default function FaqPage() {
  return (
    <div className="screen page-content legal-page">
      <header className="legal-page__header">
        <Link href="/settings/support" className="legal-page__back">
          ← Help &amp; support
        </Link>
        <h1 className="legal-page__title">FAQ</h1>
        <p className="legal-page__updated">Quick answers for {APP_DISPLAY_NAME} operators</p>
      </header>

      <div className="legal-page__body card rinse-prose">
        {SUPPORT_FAQ.map((item) => (
          <section key={item.id} id={item.id}>
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
