'use client'

import { useEffect } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import {
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_SLUGS,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import { trackOnboardingStepViewed } from '@/lib/onboarding-analytics'
import type { AppSettings } from '@/lib/settings'

interface OnboardingShellProps {
  step: OnboardingStepSlug
  settings: AppSettings | null
  title?: string
  /** Short bridge line below progress (e.g. first step after welcome) */
  intro?: string
  /** iOS table footer — small hint below the main content */
  footnote?: string
  continueLabel?: string
  continueDisabled?: boolean
  saving?: boolean
  showBack?: boolean
  secondaryAction?: React.ReactNode
  onBack?: () => void
  onContinue: () => void
  children: React.ReactNode
}

export default function OnboardingShell({
  step,
  title,
  intro,
  footnote,
  continueLabel = 'Continue',
  continueDisabled = false,
  saving = false,
  showBack = true,
  secondaryAction,
  onBack,
  onContinue,
  children,
}: OnboardingShellProps) {
  const stepIdx = Math.max(0, ONBOARDING_STEP_SLUGS.indexOf(step))

  useEffect(() => {
    trackOnboardingStepViewed(step)
  }, [step])

  return (
    <div className="onboarding-flow setup-flow client-light-root">
      <header className="onboarding-flow__top">
        <div className="onboarding-flow__nav">
          {showBack && onBack ? (
            <button type="button" className="onboarding-flow__back" onClick={onBack} aria-label="Back">
              <ArrowLeft size={20} weight="bold" />
            </button>
          ) : (
            <span className="onboarding-flow__nav-spacer" aria-hidden="true" />
          )}
          {title ? (
            <h1 className="onboarding-flow__nav-title">{title}</h1>
          ) : (
            <span className="onboarding-flow__nav-title onboarding-flow__nav-title--empty" aria-hidden="true" />
          )}
          <span className="onboarding-flow__nav-spacer" aria-hidden="true" />
        </div>
        <div
          className="onboarding-flow__progress"
          role="progressbar"
          aria-valuenow={stepIdx + 1}
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_STEP_COUNT}
          aria-label={`Step ${stepIdx + 1} of ${ONBOARDING_STEP_COUNT}`}
        >
          {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
            <div
              key={i}
              className={[
                'onboarding-flow__progress-seg',
                i <= stepIdx ? ' onboarding-flow__progress-seg--done' : '',
                i === stepIdx ? ' onboarding-flow__progress-seg--current' : '',
              ].join('')}
            />
          ))}
        </div>
      </header>

      <div className="onboarding-flow__body">
        <div className="onboarding-step">
          {intro ? <p className="onboarding-step__intro">{intro}</p> : null}
          {children}
          {footnote ? <p className="onboarding-step__footnote">{footnote}</p> : null}
        </div>
      </div>

      <footer className="onboarding-flow__footer">
        {secondaryAction}
        <button
          type="button"
          className="setup-btn-primary"
          disabled={continueDisabled || saving}
          onClick={onContinue}
        >
          {saving ? 'Saving…' : continueLabel}
        </button>
      </footer>
    </div>
  )
}
