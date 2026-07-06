'use client'

import { Suspense } from 'react'
import AccountAuth from '@/components/AccountAuth'

function AuthPageInner() {
  return (
    <AccountAuth
      onAuthenticated={(options) => {
        if (options?.isSignup) return
        window.location.replace('/')
      }}
    />
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading-screen">
          <div className="auth-loading-text">Loading…</div>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  )
}
