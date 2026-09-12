'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PasswordResetConfirm from '@/components/PasswordResetConfirm'

function ResetPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  if (!token) {
    return (
      <div className="auth-screen">
        <h1 className="auth-screen__title">Invalid reset link</h1>
        <p className="auth-screen__subtitle">
          This password reset link is missing or expired. Request a new one from sign in or Settings → Account.
        </p>
      </div>
    )
  }

  return (
    <PasswordResetConfirm
      token={token}
      onAuthenticated={() => window.location.replace('/auth')}
    />
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading-screen">
          <div className="auth-loading-text">Loading…</div>
        </div>
      }
    >
      <ResetPageInner />
    </Suspense>
  )
}
