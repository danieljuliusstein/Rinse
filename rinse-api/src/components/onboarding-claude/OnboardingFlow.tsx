'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, X } from 'lucide-react'
import { onboardingSteps, type OnboardingStep } from './onboarding-data'
import { PhoneFrame } from './PhoneFrame'
import './onboarding-claude.css'

const COLORS = {
  bg: '#0f1117',
  bgSoft: '#171a24',
  accent: '#22c55e',
  accent2: '#7dd3fc',
  ink: '#F5F6FA',
  inkMuted: 'rgba(245,246,250,0.62)',
}

type OnboardingFlowProps = {
  onComplete: () => void
  onSkip?: () => void
  onSlideChange?: (slideIndex: number) => void
  signInHref?: string
  onSignInClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function OnboardingFlow({
  onComplete,
  onSkip,
  onSlideChange,
  signInHref,
  onSignInClick,
}: OnboardingFlowProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduceMotion = useReducedMotion()
  const step = onboardingSteps[index]
  const isLast = index === onboardingSteps.length - 1

  useEffect(() => {
    onSlideChange?.(index)
  }, [index, onSlideChange])

  function goNext() {
    if (isLast) {
      onComplete()
      return
    }
    setDirection(1)
    setIndex((i) => Math.min(i + 1, onboardingSteps.length - 1))
  }

  function goBack() {
    if (index === 0) return
    setDirection(-1)
    setIndex((i) => Math.max(i - 1, 0))
  }

  const slideTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div className="ob-flow" style={{ backgroundColor: COLORS.bg, color: COLORS.ink }}>
      <span className="ob-flow__glow ob-flow__glow--a" aria-hidden />
      <span className="ob-flow__glow ob-flow__glow--b" aria-hidden />

      <div className="ob-flow__top">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="ob-flow__icon-btn"
          style={{
            opacity: index === 0 ? 0 : 0.8,
            pointerEvents: index === 0 ? 'none' : 'auto',
          }}
        >
          <ChevronLeft size={20} />
        </button>

        {!isLast && onSkip ? (
          <button type="button" onClick={onSkip} className="ob-flow__skip">
            Skip <X size={13} />
          </button>
        ) : null}
      </div>

      <div className="ob-flow__content">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={reduceMotion ? false : { opacity: 0, x: direction * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: direction * -16 }}
            transition={slideTransition}
            className="ob-flow__slide"
          >
            <StepBody step={step} reduceMotion={!!reduceMotion} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="ob-flow__bottom">
        <div className="ob-flow__dots" role="tablist" aria-label="Onboarding progress">
          {onboardingSteps.map((_, i) => (
            <span
              key={i}
              role="tab"
              aria-selected={i === index}
              className={`ob-flow__dot${i === index ? ' ob-flow__dot--active' : ''}`}
            />
          ))}
        </div>

        <button type="button" onClick={goNext} className="ob-flow__cta">
          {stepCta(step)}
        </button>

        {onSkip && signInHref ? (
          <p className="ob-flow__escape">
            <button type="button" className="ob-flow__escape-skip" onClick={onSkip}>
              Skip
            </button>
            <span aria-hidden="true"> · </span>
            <Link href={signInHref} className="ob-flow__escape-link" onClick={onSignInClick}>
              Already have an account?
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function stepCta(step: OnboardingStep) {
  if (step.kind === 'hero' || step.kind === 'closing') return step.cta
  return 'Continue'
}

function StepBody({ step, reduceMotion }: { step: OnboardingStep; reduceMotion: boolean }) {
  switch (step.kind) {
    case 'hero':
      return (
        <div className="ob-step ob-step--center">
          <PhoneFrame {...step.phone} />
          <div className="ob-step__text">
            <span className="ob-step__eyebrow">{step.eyebrow}</span>
            <h1 className="ob-step__title ob-step__title--lg">{step.title}</h1>
            <p className="ob-step__body">{step.body}</p>
          </div>
        </div>
      )

    case 'showcase':
      return (
        <div className="ob-step ob-step--center">
          <PhoneFrame {...step.phone} />
          <div className="ob-step__text">
            <span className="ob-step__eyebrow ob-step__eyebrow--cool">{step.accent}</span>
            <h1 className="ob-step__title ob-step__title--md">{step.title}</h1>
            <p className="ob-step__body">{step.body}</p>
          </div>
        </div>
      )

    case 'checklist':
      return (
        <div className="ob-step ob-step--list">
          <div className="ob-step__text ob-step__text--center">
            <span className="ob-step__eyebrow">{step.accent}</span>
            <h1 className="ob-step__title ob-step__title--md">{step.title}</h1>
          </div>
          <ul className="ob-feature-list">
            {step.items.map((item, i) => {
              const ItemIcon = item.icon
              return (
                <motion.li
                  key={item.label}
                  className="ob-feature-list__item"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.06 * i, duration: 0.3 }}
                >
                  <span className="ob-feature-list__icon">
                    <ItemIcon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="ob-feature-list__label">{item.label}</span>
                </motion.li>
              )
            })}
          </ul>
        </div>
      )

    case 'timeline':
      return (
        <div className="ob-step ob-step--list">
          <div className="ob-step__text ob-step__text--center">
            <span className="ob-step__eyebrow ob-step__eyebrow--cool">{step.accent}</span>
            <h1 className="ob-step__title ob-step__title--md">{step.title}</h1>
          </div>
          <ol className="ob-timeline">
            <span className="ob-timeline__rail" aria-hidden />
            {step.items.map((item, i) => {
              const ItemIcon = item.icon
              return (
                <motion.li
                  key={item.label}
                  className="ob-timeline__item"
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.09 * i, duration: 0.3 }}
                >
                  <span className={`ob-timeline__dot${i === 0 ? ' ob-timeline__dot--first' : ''}`}>
                    <ItemIcon size={15} strokeWidth={2} />
                  </span>
                  <span className="ob-feature-list__label">{item.label}</span>
                </motion.li>
              )
            })}
          </ol>
        </div>
      )

    case 'closing':
      return (
        <div className="ob-step ob-step--center">
          <PhoneFrame {...step.phone} />
          <h1 className="ob-step__title ob-step__title--md ob-step__title--closing">{step.title}</h1>
        </div>
      )
  }
}
