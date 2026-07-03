'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import {
  completeRinseTour,
  nextRinseTourStep,
  prevRinseTourStep,
  rinseTourEndedNaturally,
  setRinseTourLayout,
  skipRinseTourSection,
  subscribeRinseTour,
} from '@/lib/rinse-tour/controller'
import { cutoutClipPath, layoutTourCard, measureTarget } from '@/lib/rinse-tour/position'
import type { RinseTourLayout, RinseTourStep } from '@/lib/rinse-tour/types'
import { prepareTourStepRoute, waitForLayoutSettle } from '@/lib/tour-nav'

interface RinseTourOverlayProps {
  onFinished: () => void
}

const SPOTLIGHT_CLASS = 'rinse-tour-spotlight'

function sectionLabel(section: string): string {
  const labels: Record<string, string> = {
    home: 'Home',
    jobs: 'Jobs',
    clients: 'Clients',
    money: 'Money',
    pipeline: 'Pipeline',
  }
  return labels[section] ?? section
}

function clearSpotlightTarget(activeEl: Element | null): void {
  activeEl?.classList.remove(SPOTLIGHT_CLASS)
}

function applySpotlightTarget(selector: string | undefined): Element | null {
  if (!selector) return null
  const el = document.querySelector(selector)
  el?.classList.add(SPOTLIGHT_CLASS)
  return el
}

export default function RinseTourOverlay({ onFinished }: RinseTourOverlayProps) {
  const [step, setStep] = useState<RinseTourStep | null>(null)
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [layout, setLayout] = useState<RinseTourLayout | null>(null)
  const [spotlightRadius, setSpotlightRadius] = useState(14)
  const [transitioning, setTransitioning] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)
  const spotlightElRef = useRef<Element | null>(null)
  const preparing = useRef(false)

  const measure = useCallback((activeStep: RinseTourStep) => {
    const spotlight = activeStep.selector
      ? measureTarget(activeStep.selector, {
          pad: activeStep.spotlightPad,
          radius: activeStep.spotlightRadius,
        })
      : null
    const cardHeight = cardRef.current?.offsetHeight ?? 200
    const nextLayout = layoutTourCard(spotlight, {
      placement: activeStep.placement ?? 'auto',
      cardMode: activeStep.cardMode,
      cardHeight,
    })
    setSpotlightRadius(spotlight?.radius ?? 14)
    setRinseTourLayout(nextLayout)
    setLayout(nextLayout)
  }, [])

  const prepareStep = useCallback(
    async (activeStep: RinseTourStep, stepIndex: number, steps: RinseTourStep[]) => {
      if (preparing.current) return
      preparing.current = true

      try {
        clearSpotlightTarget(spotlightElRef.current)
        spotlightElRef.current = null

        if (activeStep.beforeShow) {
          await activeStep.beforeShow()
        }

        const waitSel = activeStep.waitFor ?? activeStep.selector
        const ready = await prepareTourStepRoute(activeStep.route, waitSel ?? undefined)
        if (!ready && waitSel) {
          await prepareTourStepRoute(undefined, waitSel)
        }

        if (activeStep.selector) {
          document.querySelector(activeStep.selector)?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
          await waitForLayoutSettle()
        }

        spotlightElRef.current = applySpotlightTarget(activeStep.selector)

        setStep(activeStep)
        setIndex(stepIndex)
        setTotal(steps.length)
        setTransitioning(true)

        await waitForLayoutSettle()
        measure(activeStep)

        window.setTimeout(() => {
          if (preparing.current) return
          measure(activeStep)
        }, 280)
      } finally {
        preparing.current = false
        setTransitioning(false)
      }
    },
    [measure],
  )

  useEffect(() => {
    return subscribeRinseTour((state) => {
      if (!state.active) {
        clearSpotlightTarget(spotlightElRef.current)
        spotlightElRef.current = null
        setStep(null)
        setLayout(null)
        document.body.classList.remove('rinse-tour-active')
        if (rinseTourEndedNaturally()) onFinished()
        return
      }
      if (!state.step) return
      document.body.classList.add('rinse-tour-active')
      void prepareStep(state.step, state.index, state.steps)
    })
  }, [onFinished, prepareStep])

  useEffect(() => {
    return () => {
      clearSpotlightTarget(spotlightElRef.current)
    }
  }, [])

  useEffect(() => {
    if (!step) return

    const update = () => measure(step)
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [measure, step])

  useEffect(() => {
    if (!step || transitioning) return
    measure(step)
  }, [measure, step, transitioning])

  useEffect(() => {
    if (!step || transitioning) return
    primaryBtnRef.current?.focus({ preventScroll: true })
  }, [step, transitioning, index])

  useEffect(() => {
    if (!step) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        completeRinseTour()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [step])

  if (!step || !layout) return null

  const isFirst = index === 0
  const isLast = index >= total - 1

  const spotlightStyle = layout.spotlight
    ? {
        top: layout.spotlight.top,
        left: layout.spotlight.left,
        width: layout.spotlight.width,
        height: layout.spotlight.height,
      }
    : null

  const clipPath = spotlightStyle ? cutoutClipPath(layout.spotlight, spotlightRadius) : undefined

  return (
    <div className="rinse-tour" role="presentation">
      <div className="rinse-tour__shade" aria-hidden="true">
        {spotlightStyle ? (
          <>
            <div
              className="rinse-tour__shade-blocker"
              style={clipPath ? { clipPath, WebkitClipPath: clipPath } : undefined}
            />
            <div
              className="rinse-tour__hole"
              style={{
                top: spotlightStyle.top,
                left: spotlightStyle.left,
                width: spotlightStyle.width,
                height: spotlightStyle.height,
                borderRadius: spotlightRadius,
              }}
            >
              <div className="rinse-tour__ring" style={{ borderRadius: spotlightRadius }} />
            </div>
          </>
        ) : (
          <div className="rinse-tour__shade-panel rinse-tour__shade-full" />
        )}
      </div>

      <div
        ref={cardRef}
        className={`rinse-tour__card${transitioning ? ' rinse-tour__card--enter' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rinse-tour-title"
        style={{
          top: layout.cardTop,
          left: layout.cardLeft,
          maxWidth: layout.cardMaxWidth,
        }}
      >
        <div className="rinse-tour__card-head">
          <p className="rinse-tour__progress">
            {index + 1} of {total}
            <span className="rinse-tour__section"> · {sectionLabel(step.section)}</span>
          </p>
          <button
            type="button"
            className="rinse-tour__close"
            aria-label="End tour"
            onClick={() => completeRinseTour()}
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <h2 id="rinse-tour-title" className="rinse-tour__title">
          {step.title}
        </h2>
        <p className="rinse-tour__body">{step.description}</p>

        <div className="rinse-tour__actions">
          {!isFirst ? (
            <button type="button" className="rinse-tour__btn rinse-tour__btn--ghost" onClick={prevRinseTourStep}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            ref={primaryBtnRef}
            type="button"
            className="rinse-tour__btn rinse-tour__btn--primary"
            onClick={() => (isLast ? completeRinseTour() : nextRinseTourStep())}
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>

        <div className="rinse-tour__skip-row">
          <button type="button" className="rinse-tour__skip" onClick={skipRinseTourSection}>
            Skip section
          </button>
          <button type="button" className="rinse-tour__skip" onClick={() => completeRinseTour()}>
            End tour
          </button>
        </div>
      </div>
    </div>
  )
}
