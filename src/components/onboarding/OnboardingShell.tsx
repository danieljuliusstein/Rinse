'use client'

import { useEffect, type ReactNode } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { SetupHeroCurve } from '@/components/setup'
import { AnimatePresence, motion } from 'motion/react'
import {
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_SLUGS,
  type OnboardingStepSlug,
} from '@/lib/onboarding'
import { trackOnboardingStepViewed } from '@/lib/onboarding-analytics'
import { springSoft, springStandard } from '@/lib/motion'
import type { AppSettings } from '@/lib/settings'

interface OnboardingShellProps {
  step: OnboardingStepSlug
  settings: AppSettings | null
  title?: string
  intro?: string
  footnote?: string
  continueLabel?: string
  continueDisabled?: boolean
  continueHint?: string
  saving?: boolean
  showBack?: boolean
  secondaryAction?: React.ReactNode
  hero?: ReactNode
  progressVariant?: 'default' | 'hero'
  demo?: boolean
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
  continueHint,
  saving = false,
  showBack = true,
  secondaryAction,
  hero,
  progressVariant = 'default',
  demo = false,
  onBack,
  onContinue,
  children,
}: OnboardingShellProps) {
  const stepIdx = Math.max(0, ONBOARDING_STEP_SLUGS.indexOf(step))
  const progressPct = ((stepIdx + 1) / ONBOARDING_STEP_COUNT) * 100

  useEffect(() => {
    if (demo) return
    trackOnboardingStepViewed(step)
  }, [demo, step])

  return (
    <div
      className={[
        'onboarding-flow',
        'setup-flow',
        'client-light-root',
        hero ? 'onboarding-flow--with-hero' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hero ? (
        <>
          <div className="setup-split__hero onboarding-flow__hero">{hero}</div>
          <SetupHeroCurve tone="light" />
        </>
      ) : null}
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
        {progressVariant === 'hero' ? (
          <div
            className="onboarding-flow__progress onboarding-flow__progress--hero onboarding-flow__progress--motion"
            role="progressbar"
            aria-valuenow={stepIdx + 1}
            aria-valuemin={1}
            aria-valuemax={ONBOARDING_STEP_COUNT}
            aria-label={`Step ${stepIdx + 1} of ${ONBOARDING_STEP_COUNT}`}
          >
            <div className="onboarding-flow__progress-track">
              <motion.div
                className="onboarding-flow__progress-fill"
                layout
                animate={{ width: `${progressPct}%` }}
                transition={springSoft}
              />
            </div>
          </div>
        ) : (
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
        )}
      </header>

      <div className="onboarding-flow__body">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="onboarding-step"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={springStandard}
          >
            {intro ? <p className="onboarding-step__intro">{intro}</p> : null}
            {children}
            {footnote ? <p className="onboarding-step__footnote">{footnote}</p> : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="onboarding-flow__footer">
        {secondaryAction}
        {continueDisabled && continueHint ? (
          <p className="onboarding-flow__continue-hint" role="status">
            {continueHint}
          </p>
        ) : null}
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
