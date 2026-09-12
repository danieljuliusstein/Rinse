'use client'

import Link from 'next/link'
import { SignIn } from '@phosphor-icons/react'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'

export default function LoggedOutBanner() {
  const { isLoggedOut, signInHref, signUpHref } = useAuthEmptyState()

  if (!isLoggedOut) return null

  return (
    <div className="logged-out-banner" role="status">
      <SignIn size={18} weight="bold" aria-hidden="true" />
      <p className="logged-out-banner__text">
        Browse freely — sign in to load your jobs, clients, and money.
      </p>
      <div className="logged-out-banner__actions">
        <Link href={signInHref} className="logged-out-banner__cta">
          Sign in
        </Link>
        <Link href={signUpHref} className="logged-out-banner__cta logged-out-banner__cta--secondary">
          Create account
        </Link>
      </div>
    </div>
  )
}
