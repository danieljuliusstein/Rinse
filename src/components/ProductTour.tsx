'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import TourWelcomeModal from '@/components/TourWelcomeModal'
import { useAuth } from '@/providers/AuthProvider'
import { clearTourNavigate, setTourNavigate, waitForRouteReady } from '@/lib/tour-nav'
import {
  TOUR_FINISHED_EVENT,
  TOUR_REPLAY_EVENT,
  destroyProductTour,
  dismissTourWelcome,
  isTourActive,
  isTourCompleted,
  shouldAutoStartTour,
  shouldShowTourWelcome,
  skipProductTour,
  startProductTour,
} from '@/lib/product-tour'

export default function ProductTour() {
  const pathname = usePathname()
  const router = useRouter()
  const { needsOnboarding } = useAuth()
  const startingRef = useRef(false)
  const suppressAutoStartRef = useRef(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    setTourNavigate(async (path: string) => {
      router.push(path)
      await waitForRouteReady(path)
    })
    return () => clearTourNavigate()
  }, [router])

  useEffect(() => {
    const onFinished = () => {
      suppressAutoStartRef.current = true
      window.setTimeout(() => {
        suppressAutoStartRef.current = false
      }, 2500)
    }
    window.addEventListener(TOUR_FINISHED_EVENT, onFinished)
    return () => window.removeEventListener(TOUR_FINISHED_EVENT, onFinished)
  }, [])

  const runTour = useCallback(() => {
    if (startingRef.current) return
    startingRef.current = true
    setWelcomeOpen(false)
    dismissTourWelcome()
    void startProductTour().finally(() => {
      startingRef.current = false
    })
  }, [])

  const handleSkip = useCallback(() => {
    setWelcomeOpen(false)
    skipProductTour()
  }, [])

  useEffect(() => {
    const onReplay = () => {
      if (needsOnboarding || startingRef.current) return
      if (!shouldAutoStartTour()) return

      void (async () => {
        if (pathname !== '/') {
          router.push('/')
          const ready = await waitForRouteReady('/')
          if (!ready) return
        }

        if (shouldShowTourWelcome()) {
          setWelcomeOpen(true)
          return
        }

        runTour()
      })()
    }

    window.addEventListener(TOUR_REPLAY_EVENT, onReplay)
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, onReplay)
  }, [pathname, needsOnboarding, router, runTour])

  useEffect(() => {
    const tryStart = () => {
      if (suppressAutoStartRef.current) return
      if (pathname !== '/' || needsOnboarding || startingRef.current || isTourCompleted()) return
      if (!shouldAutoStartTour()) return

      if (shouldShowTourWelcome()) {
        setWelcomeOpen(true)
        return
      }

      runTour()
    }

    if (needsOnboarding) {
      startingRef.current = false
      setWelcomeOpen(false)
      destroyProductTour()
      return
    }

    if (pathname !== '/' && !isTourActive()) {
      startingRef.current = false
      setWelcomeOpen(false)
      destroyProductTour()
      return
    }

    if (pathname !== '/' || isTourActive()) return

    const timer = window.setTimeout(tryStart, 600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname, needsOnboarding, runTour])

  useEffect(() => {
    return () => {
      destroyProductTour()
    }
  }, [])

  if (!welcomeOpen) return null

  return <TourWelcomeModal onStart={runTour} onSkip={handleSkip} />
}
