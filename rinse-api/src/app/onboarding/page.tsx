'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OnboardingBusinessStep from '@/components/onboarding/OnboardingBusinessStep'
import OnboardingYourInvoiceStep from '@/components/onboarding/OnboardingYourInvoiceStep'
import OnboardingBookingStep from '@/components/onboarding/OnboardingBookingStep'
import OnboardingPlansStep from '@/components/onboarding/OnboardingPlansStep'
import { SetupLoadingScreen } from '@/components/setup'
import {
  loadOnboardingProgress,
  needsOnboarding,
  onboardingStepUrl,
  resolveOnboardingStep,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'
import './onboarding.css'

function OnboardingRouter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSlug = searchParams.get('step')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [step, setStep] = useState<OnboardingStepSlug>('business')
  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadOnboardingProgress()
        if (!needsOnboarding(loaded)) {
          router.replace('/')
          return
        }
        const resolved = resolveOnboardingStep(urlSlug, loaded)
        setSettings(loaded)
        setStep(resolved)
        if (urlSlug !== resolved) {
          router.replace(onboardingStepUrl(resolved))
        }
      } catch {
        setLoadError('Could not load setup. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [router, urlSlug])

  const navigateToStep = useCallback(
    (nextSettings: AppSettings, nextStep: OnboardingStepSlug) => {
      setSettings(nextSettings)
      setStep(nextStep)
      router.replace(onboardingStepUrl(nextStep))
    },
    [router],
  )

  const handleComplete = useCallback(() => {
    router.replace('/')
  }, [router])

  if (loading || !settings) {
    if (loadError) {
      return (
        <div className="setup-flow client-light-root setup-offline-shell">
          <div className="offline-banner" role="alert">
            <span className="offline-banner__message">{loadError}</span>
            <button
              type="button"
              className="offline-banner__sync"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return <SetupLoadingScreen />
  }

  switch (step) {
    case 'business':
      return <OnboardingBusinessStep step={step} settings={settings} onSaved={navigateToStep} />
    case 'your-invoice':
      return <OnboardingYourInvoiceStep step={step} settings={settings} onSaved={navigateToStep} />
    case 'booking':
      return <OnboardingBookingStep step={step} settings={settings} onSaved={navigateToStep} />
    case 'plans':
      return (
        <OnboardingPlansStep
          step={step}
          settings={settings}
          onComplete={handleComplete}
          onBack={navigateToStep}
        />
      )
    default:
      return <OnboardingBusinessStep step="business" settings={settings} onSaved={navigateToStep} />
  }
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<SetupLoadingScreen />}>
      <OnboardingRouter />
    </Suspense>
  )
}
