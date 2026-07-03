'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLogo from '@/components/AppLogo'

const FEATURES = [
  'Share your booking link',
  'Send invoices & get paid',
  'Track jobs from your phone',
]

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="welcome-screen setup-flow client-light-root">
      <div className="welcome-screen__hero">
        <div className="welcome-screen__logo-wrap">
          <AppLogo size={80} priority />
        </div>
        <p className="welcome-screen__eyebrow">Mobile detailing</p>
        <h1 className="welcome-screen__title">Run your business from your phone</h1>
        <p className="welcome-screen__lead">
          Book clients, send invoices, and track jobs — built for solo mobile detailers.
        </p>
        <div className="setup-feature-card">
          <ul className="setup-feature-list">
            {FEATURES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="welcome-screen__actions">
        <button type="button" className="setup-btn-primary" onClick={() => router.push('/auth?mode=signup')}>
          Get started
        </button>
        <button type="button" className="setup-btn-secondary" onClick={() => router.push('/auth')}>
          Sign in
        </button>
        <p className="welcome-screen__signin">
          Already have an account? <Link href="/auth">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
