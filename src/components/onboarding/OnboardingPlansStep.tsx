'use client'

import { useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import OnboardingShell from './OnboardingShell'
import { useAuth } from '@/providers/AuthProvider'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import { readApiJson } from '@/lib/api-json'
import { STARTER_PLAN } from '@/lib/plans'
import { completeOnboarding } from '@/lib/onboarding'
import { trackOnboardingStepCompleted } from '@/lib/onboarding-analytics'
import { markTourPending } from '@/lib/product-tour'
import { prevStepSlug, type OnboardingStepSlug } from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'

interface OnboardingPlansStepProps {
  step: OnboardingStepSlug
  settings: AppSettings
  onComplete: () => void
  onBack: (settings: AppSettings, prev: OnboardingStepSlug) => void
}

export default function OnboardingPlansStep({ step, settings, onComplete, onBack }: OnboardingPlansStepProps) {
  const { refreshOnboardingGate } = useAuth()
  const { daysLeft, showTrialBanner } = useOrgSubscription()
  const [busy, setBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState('')

  const handleContinueTrial = async () => {
    setBusy(true)
    setError('')
    try {
      await completeOnboarding({ firstInvoiceCreated: Boolean(settings.onboarding_first_invoice_at) })
      trackOnboardingStepCompleted(step)
      markTourPending()
      const finished = await refreshOnboardingGate()
      if (!finished) {
        setError('Setup saved locally but could not confirm — try again.')
        return
      }
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish setup')
    } finally {
      setBusy(false)
    }
  }

  const handleSubscribe = async () => {
    setCheckoutBusy(true)
    setError('')
    try {
      const token = getPocketBaseAuthToken()
      if (!token) throw new Error('Not signed in')
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'starter' }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(String(data.error ?? 'Checkout failed'))
      const url = typeof data.url === 'string' ? data.url : null
      if (url) window.location.href = url
      else throw new Error('Could not open checkout')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout')
    } finally {
      setCheckoutBusy(false)
    }
  }

  return (
    <OnboardingShell
      step={step}
      settings={settings}
      title="Your plan"
      footnote="14-day trial started at signup. No card required."
      continueLabel="Get started"
      saving={busy}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onBack(settings, prev)
      }}
      onContinue={() => void handleContinueTrial()}
      secondaryAction={
        <button
          type="button"
          className="setup-btn-secondary"
          disabled={checkoutBusy || busy}
          onClick={() => void handleSubscribe()}
        >
          {checkoutBusy ? 'Opening checkout…' : 'Subscribe now'}
        </button>
      }
    >
      {showTrialBanner && daysLeft != null ? (
        <p className="onboarding-plans-trial">
          <Sparkle size={14} weight="fill" aria-hidden="true" /> {daysLeft} day{daysLeft === 1 ? '' : 's'} left in
          trial
        </p>
      ) : null}

      <div className="onboarding-plans-card">
        <div className="onboarding-plans-card__head">
          <strong>{STARTER_PLAN.name}</strong>
          <span className="onboarding-plans-card__price">{STARTER_PLAN.priceLabel}</span>
        </div>
        <p className="onboarding-plans-card__tagline" style={{ margin: '0 0 4px' }}>
          {STARTER_PLAN.tagline}
        </p>
        <ul>
          {STARTER_PLAN.features.slice(0, 8).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      {error ? <p className="onboarding-error">{error}</p> : null}
    </OnboardingShell>
  )
}
