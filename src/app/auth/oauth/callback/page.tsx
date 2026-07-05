'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOAuthLogin, ensureOAuthProvisioned } from '@/lib/pb-oauth'
import { markTourPending } from '@/lib/product-tour'

function OAuthCallbackInner() {
  const router = useRouter()
  const [message, setMessage] = useState('Finishing sign in…')

  useEffect(() => {
    void (async () => {
      try {
        const ok = await completeOAuthLogin()
        if (!ok) {
          setMessage('Sign in failed. Redirecting…')
          router.replace('/auth')
          return
        }
        await ensureOAuthProvisioned()
        markTourPending()
        const { loadSettingsAsync } = await import('@/lib/settings')
        const { needsOnboarding, onboardingStepUrl } = await import('@/lib/onboarding')
        const settings = await loadSettingsAsync()
        router.replace(
          settings && needsOnboarding(settings) ? onboardingStepUrl('business') : '/',
        )
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Sign in failed')
        window.setTimeout(() => router.replace('/auth'), 2000)
      }
    })()
  }, [router])

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-text">{message}</div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading-screen">
          <div className="auth-loading-text">Loading…</div>
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  )
}
