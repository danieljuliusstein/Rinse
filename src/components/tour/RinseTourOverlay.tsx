'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import {
  completeRinseTour,
  nextRinseTourStep,
  prevRinseTourStep,
  rinseTourEndedNaturally,
  skipRinseTourSection,
  subscribeRinseTour,
} from '@/lib/rinse-tour/controller'
import { getShadePanels, layoutTourCard, measureTarget } from '@/lib/rinse-tour/position'
import type { RinseTourLayout, RinseTourStep } from '@/lib/rinse-tour/types'
import { prepareTourStepRoute, waitForLayoutSettle } from '@/lib/tour-nav'

interface RinseTourOverlayProps {
  onFinished: () => void
  onDismiss: () => void
}

const EXIT_MS = 420
const RESIZE_DEBOUNCE_MS = 120

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

function panelStyle(rect: { top: number; left: number; width: number; height: number }) {
  if (rect.width < 1 || rect.height < 1) return { display: 'none' as const }
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export default function RinseTourOverlay({ onFinished, onDismiss }: RinseTourOverlayProps) {
  const [step, setStep] = useState<RinseTourStep | null>(null)
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [layout, setLayout] = useState<RinseTourLayout | null>(null)
  const [spotlightRadius, setSpotlightRadius] = useState(14)
  const [stepPrep, setStepPrep] = useState(false)
  const [exiting, setExiting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)
  const preparing = useRef(false)
  const measureFrame = useRef<number | null>(null)
  const resizeTimer = useRef<number | null>(null)
  const exitTimer = useRef<number | null>(null)
  const navigateTimer = useRef<number | null>(null)
  const stepRef = useRef<RinseTourStep | null>(null)
  const finishedRef = useRef(false)
  const preparedKeyRef = useRef<string | null>(null)
  const beginExitRef = useRef<() => void>(() => {})
  const prepareStepRef = useRef<
    (activeStep: RinseTourStep, stepIndex: number, steps: RinseTourStep[]) => Promise<void>
  >(async () => {})

  const measure = useCallback((activeStep: RinseTourStep) => {
    const spotlight = activeStep.selector
      ? measureTarget(activeStep.selector, {
          pad: activeStep.spotlightPad,
          radius: activeStep.spotlightRadius,
          shape: activeStep.spotlightShape,
        })
      : null
    const cardHeight = cardRef.current?.offsetHeight ?? 200
    const nextLayout = layoutTourCard(spotlight, {
      placement: activeStep.placement ?? 'auto',
      cardMode: activeStep.cardMode,
      cardHeight,
    })
    setSpotlightRadius(spotlight?.radius ?? 14)
    setLayout(nextLayout)
  }, [])

  const scheduleMeasure = useCallback(
    (activeStep: RinseTourStep) => {
      if (measureFrame.current !== null) {
        cancelAnimationFrame(measureFrame.current)
      }
      measureFrame.current = requestAnimationFrame(() => {
        measureFrame.current = null
        if (stepRef.current?.id !== activeStep.id) return
        measure(activeStep)
      })
    },
    [measure],
  )

  const finishOverlay = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    preparedKeyRef.current = null
    document.body.classList.remove('rinse-tour-active')
    stepRef.current = null
    setStep(null)
    setLayout(null)
    setExiting(false)
    setStepPrep(false)
    onDismiss()
  }, [onDismiss])

  const beginExit = useCallback(() => {
    if (finishedRef.current) return
    setExiting(true)
    if (rinseTourEndedNaturally()) {
      if (navigateTimer.current !== null) window.clearTimeout(navigateTimer.current)
      navigateTimer.current = window.setTimeout(() => {
        navigateTimer.current = null
        onFinished()
      }, Math.round(EXIT_MS * 0.35))
    }
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = null
      finishOverlay()
    }, EXIT_MS)
  }, [finishOverlay, onFinished])

  const prepareStep = useCallback(
    async (activeStep: RinseTourStep, stepIndex: number, steps: RinseTourStep[]) => {
      if (preparing.current) return
      preparing.current = true
      stepRef.current = activeStep
      setStepPrep(true)

      try {
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

        await waitForLayoutSettle()
        measure(activeStep)

        setStep(activeStep)
        setIndex(stepIndex)
        setTotal(steps.length)
        setStepPrep(false)
      } finally {
        preparing.current = false
      }
    },
    [measure],
  )

  beginExitRef.current = beginExit
  prepareStepRef.current = prepareStep

  useEffect(() => {
    return subscribeRinseTour((state) => {
      if (!state.active) {
        if (stepRef.current) {
          beginExitRef.current()
        }
        return
      }
      if (!state.step) return

      const key = `${state.index}:${state.step.id}`
      if (!state.transitioning && preparedKeyRef.current === key) return

      finishedRef.current = false
      document.body.classList.add('rinse-tour-active')
      preparedKeyRef.current = key
      void prepareStepRef.current(state.step, state.index, state.steps)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (measureFrame.current !== null) cancelAnimationFrame(measureFrame.current)
      if (resizeTimer.current !== null) window.clearTimeout(resizeTimer.current)
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
      if (navigateTimer.current !== null) window.clearTimeout(navigateTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!step) return

    const update = () => {
      if (preparing.current || exiting) return
      if (resizeTimer.current !== null) window.clearTimeout(resizeTimer.current)
      resizeTimer.current = window.setTimeout(() => {
        resizeTimer.current = null
        if (stepRef.current) scheduleMeasure(stepRef.current)
      }, RESIZE_DEBOUNCE_MS)
    }

    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    window.addEventListener('resize', update)

    return () => {
      vv?.removeEventListener('resize', update)
      window.removeEventListener('resize', update)
      if (resizeTimer.current !== null) window.clearTimeout(resizeTimer.current)
    }
  }, [exiting, scheduleMeasure, step])

  useEffect(() => {
    if (!step || stepPrep) return
    primaryBtnRef.current?.focus({ preventScroll: true })
  }, [step, index, stepPrep])

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

  if ((!step || !layout) && !exiting) return null

  const isFirst = index === 0
  const isLast = index >= total - 1

  const spotlightStyle = layout?.spotlight
    ? {
        top: layout.spotlight.top,
        left: layout.spotlight.left,
        width: layout.spotlight.width,
        height: layout.spotlight.height,
      }
    : null

  const shadePanels =
    spotlightStyle && typeof window !== 'undefined'
      ? getShadePanels(layout!.spotlight!, {
          width: window.innerWidth,
          height: window.innerHeight,
        })
      : null

  const rootClass = ['rinse-tour', exiting ? 'rinse-tour--exit' : '', stepPrep ? 'rinse-tour--prep' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} role="presentation">
      <div className="rinse-tour__shade" aria-hidden="true">
        {shadePanels && spotlightStyle ? (
          <>
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <div
                key={side}
                className="rinse-tour__shade-panel rinse-tour__shade-panel--block"
                style={panelStyle(shadePanels[side])}
              />
            ))}
            <div
              className="rinse-tour__spotlight-block"
              style={{
                top: spotlightStyle.top,
                left: spotlightStyle.left,
                width: spotlightStyle.width,
                height: spotlightStyle.height,
                borderRadius: spotlightRadius,
              }}
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
          <div className="rinse-tour__shade-panel rinse-tour__shade-full rinse-tour__shade-panel--block" />
        )}
      </div>

      {step && layout ? (
        <div
          ref={cardRef}
          className="rinse-tour__card"
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
      ) : null}
    </div>
  )
}
