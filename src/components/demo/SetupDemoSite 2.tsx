'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowCounterClockwise, House } from '@phosphor-icons/react'
import OnboardingBusinessStep from '@/components/onboarding/OnboardingBusinessStep'
import OnboardingYourInvoiceStep from '@/components/onboarding/OnboardingYourInvoiceStep'
import OnboardingBookingStep from '@/components/onboarding/OnboardingBookingStep'
import OnboardingPlansStep from '@/components/onboarding/OnboardingPlansStep'
import SetupDemoAuth from '@/components/demo/SetupDemoAuth'
import SetupDemoWelcome from '@/components/demo/SetupDemoWelcome'
import SetupIntroFlow from '@/components/setup/SetupIntroFlow'
import {
  DEMO_BOOKING_SLUG,
  DEMO_SETUP_PACKAGES,
  DEMO_SETUP_SETTINGS,
  SETUP_DEMO_SCREENS,
  type SetupDemoScreenId,
  nextSetupDemoScreen,
} from '@/lib/setup-demo'
import type { OnboardingStepSlug } from '@/lib/onboarding'
import type { AppSettings } from '@/lib/settings'

function isOnboardingScreen(screen: SetupDemoScreenId): screen is OnboardingStepSlug {
  return screen === 'business' || screen === 'your-invoice' || screen === 'booking' || screen === 'plans'
}

export default function SetupDemoSite() {
  const [screen, setScreen] = useState<SetupDemoScreenId>('welcome')
  const [settings, setSettings] = useState<AppSettings>(DEMO_SETUP_SETTINGS)

  const goTo = useCallback((next: SetupDemoScreenId) => {
    setScreen(next)
  }, [])

  const goNext = useCallback(() => {
    const next = nextSetupDemoScreen(screen)
    if (next) setScreen(next)
  }, [screen])

  const handleOnboardingSaved = useCallback((nextSettings: AppSettings, step: OnboardingStepSlug) => {
    setSettings(nextSettings)
    setScreen(step)
  }, [])

  const restart = useCallback(() => {
    setSettings(DEMO_SETUP_SETTINGS)
    setScreen('welcome')
  }, [])

  return (
    <div className="setup-demo-site">
      <header className="setup-demo-site__header">
        <Link href="/demo" className="setup-demo-site__back">
          ← Demo index
        </Link>
        <div className="setup-demo-site__title-wrap">
          <h1>Setup funnel demo</h1>
          <p>Walk the full welcome → onboarding flow. No account, no saves.</p>
        </div>
        <button type="button" className="setup-demo-site__restart" onClick={restart}>
          <ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" />
          Restart
        </button>
      </header>

      <nav className="setup-demo-site__nav" aria-label="Setup screens">
        {SETUP_DEMO_SCREENS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={screen === item.id ? 'setup-demo-site__chip setup-demo-site__chip--on' : 'setup-demo-site__chip'}
            onClick={() => goTo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="setup-demo-site__frame-wrap">
        <span className="demo-mode-badge">Demo — no account</span>
        <div className="demo-frame setup-demo-site__frame">
          {screen === 'welcome' ? (
            <SetupDemoWelcome onGetStarted={() => goTo('intro')} onSignIn={() => goTo('auth')} />
          ) : null}

          {screen === 'intro' ? (
            <SetupIntroFlow
              demo
              onDemoFinish={() => goTo('auth')}
              onDemoSkip={() => goTo('welcome')}
              onDemoSignIn={() => goTo('auth')}
            />
          ) : null}

          {screen === 'auth' ? <SetupDemoAuth onContinue={() => goTo('business')} /> : null}

          {screen === 'business' ? (
            <OnboardingBusinessStep
              step="business"
              settings={settings}
              demo
              onSaved={handleOnboardingSaved}
            />
          ) : null}

          {screen === 'your-invoice' ? (
            <OnboardingYourInvoiceStep
              step="your-invoice"
              settings={settings}
              demo
              demoPackages={DEMO_SETUP_PACKAGES}
              onSaved={handleOnboardingSaved}
            />
          ) : null}

          {screen === 'booking' ? (
            <OnboardingBookingStep
              step="booking"
              settings={settings}
              demo
              demoSlug={DEMO_BOOKING_SLUG}
              onSaved={handleOnboardingSaved}
            />
          ) : null}

          {screen === 'plans' ? (
            <OnboardingPlansStep
              step="plans"
              settings={settings}
              demo
              onComplete={() => goTo('done')}
              onBack={handleOnboardingSaved}
            />
          ) : null}

          {screen === 'done' ? (
            <div className="setup-demo-done setup-flow client-light-root">
              <div className="setup-demo-done__body">
                <div className="setup-demo-done__icon" aria-hidden="true">
                  <House size={36} weight="duotone" />
                </div>
                <h2>You&apos;re in Rinse</h2>
                <p>That&apos;s the full setup funnel — welcome through trial.</p>
              </div>
              <footer className="setup-demo-done__footer">
                <button type="button" className="setup-btn-primary" onClick={restart}>
                  Run again
                </button>
                <Link href="/demo/home" className="setup-demo-done__link">
                  See operator home demo →
                </Link>
              </footer>
            </div>
          ) : null}
        </div>

        {isOnboardingScreen(screen) ? (
          <p className="setup-demo-site__hint">
            Use Continue on each step, or jump screens with the chips above.
          </p>
        ) : screen !== 'done' ? (
          <p className="setup-demo-site__hint">
            Tap through like a new user — or jump ahead with the chips.
            {screen === 'welcome' ? (
              <>
                {' '}
                <button type="button" className="setup-demo-inline-link" onClick={goNext}>
                  Next screen →
                </button>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}
