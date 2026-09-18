// OnboardingTour — providers + overlays for the live Desk tour session.

import { useEffect, type ReactNode } from 'react'
import { TourDataProvider } from '@/data/tour/TourDataProvider'
import { TourProvider, useTour } from './tour-provider'
import { TourChrome } from './tour-chrome'
import { WelcomeTourStop } from './stops/welcome'
import { FinishTourStop } from './stops/finish'

/** Providers that must wrap both the real shell and tour chrome. */
export function TourSession({
  children,
  onExit,
}: {
  children: ReactNode
  onExit: () => void
}) {
  return (
    <TourDataProvider>
      <TourProvider>
        <TourShellLock>{children}</TourShellLock>
        <TourOverlays onExit={onExit} />
      </TourProvider>
    </TourDataProvider>
  )
}

function TourShellLock({ children }: { children: ReactNode }) {
  const tour = useTour()
  return (
    <div
      className={
        tour.active
          ? 'tour-shell-locked relative flex h-screen min-h-0 flex-1 overflow-hidden pointer-events-none select-none'
          : 'relative flex h-screen min-h-0 flex-1 overflow-hidden'
      }
    >
      {children}
    </div>
  )
}

function TourOverlays({ onExit }: { onExit: () => void }) {
  const { phase } = useTour()

  useEffect(() => {
    if (phase === 'exited') onExit()
  }, [phase, onExit])

  return (
    <>
      {phase === 'welcome' && <WelcomeTourStop />}
      {phase === 'tour' && <TourChrome />}
      {phase === 'finish' && <FinishTourStop />}
    </>
  )
}

