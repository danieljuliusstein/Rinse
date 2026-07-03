'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import AccountAuth from '@/components/AccountAuth'

function AuthPageInner() {
  const router = useRouter()

  return (
    <AccountAuth
      onAuthenticated={(options) => {
        if (options?.isSignup) return
        router.replace('/')
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
