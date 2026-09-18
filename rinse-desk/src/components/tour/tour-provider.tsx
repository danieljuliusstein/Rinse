// ---------------------------------------------------------------------------
// tour-provider.tsx — live Desk tour orchestration
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTourData } from '@/data/tour/TourDataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useData } from '@/providers/DataProvider'
import { TOUR_STOPS, type TourStop } from './tour-stops'
import type { PageId } from '@/lib/types'

export type TourNotifyKind =
  | 'contact'
  | 'deal'
  | 'job'
  | 'invoice'
  | 'vehicle'
  | 'expense'
  | 'package'
  | 'campaign'
  | 'route'
  | 'dashboard'
  | 'settings'
export type Phase = 'welcome' | 'tour' | 'finish' | 'exited'

interface TourContextValue {
  phase: Phase
  stopIndex: number
  stop: TourStop
  total: number
  /** True while interactive tour stops are running (not welcome/finish). */
  active: boolean
  /** True whenever the tour overlay session is mounted (any phase except exited). */
  sessionOpen: boolean
  start: () => void
  next: () => void
  back: () => void
  skip: () => void
  goToStop: (i: number) => void
  goToPhase: (p: Phase) => void

  completeStop: (id: string) => void
  isStopComplete: (id: string) => boolean
  stopDone: boolean
  canNext: boolean
  /** Invoice stop with no draft and no jobs to create from — Next allowed. */
  invoiceFallback: boolean

  armedTargetId: string | null
  spotlightSelector: string
  isArmed: (targetId: string) => boolean
  /** Apply arming class + data attribute for a target. */
  targetProps: (targetId: string) => {
    'data-tour-target': string
    className: string
  }

  /** Call after a successful live mutation that finishes a stop. */
  notifyCreated: (kind: TourNotifyKind) => void

  /** Waive invoice before/after photo gate while tour invoices stop is active. */
  skipInvoicePhotoGate: boolean

  dataMode: string
  counts: { contacts: number; deals: number; invoices: number; drafts: number }
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within <TourProvider>')
  return ctx
}

export function useOptionalTour() {
  return useContext(TourContext)
}

export function TourProvider({ children }: { children: ReactNode }) {
  const data = useTourData()
  const { setPage } = useDeskNav()
  const { invoices: liveInvoices, jobs: liveJobs } = useData()

  const [phase, setPhase] = useState<Phase>('welcome')
  const [stopIndex, setStopIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())

  const stop = TOUR_STOPS[stopIndex]!
  const total = TOUR_STOPS.length
  const active = phase === 'tour'
  const sessionOpen = phase !== 'exited'

  const draftCount = useMemo(
    () => liveInvoices.filter((i) => i.status === 'draft').length,
    [liveInvoices],
  )

  /** Only when there is nothing to invoice — create-from-job needs a job. */
  const invoiceFallback = stop.id === 'invoices' && draftCount === 0 && liveJobs.length === 0

  const reset = useCallback(() => {
    setCompleted(new Set())
  }, [])

  const start = useCallback(() => {
    reset()
    setStopIndex(0)
    setPhase('tour')
  }, [reset])

  const next = useCallback(() => {
    setStopIndex((i) => {
      if (i < TOUR_STOPS.length - 1) return i + 1
      setPhase('finish')
      return i
    })
  }, [])

  const back = useCallback(() => setStopIndex((i) => Math.max(0, i - 1)), [])
  const skip = useCallback(() => setPhase('exited'), [])
  const goToPhase = useCallback((p: Phase) => setPhase(p), [])
  const goToStop = useCallback((i: number) => {
    setStopIndex(i)
    setPhase('tour')
  }, [])

  const completeStop = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev
      const nextSet = new Set(prev)
      nextSet.add(id)
      return nextSet
    })
  }, [])

  const isStopComplete = useCallback((id: string) => completed.has(id), [completed])

  const notifyCreated = useCallback(
    (kind: TourNotifyKind) => {
      if (!active) return
      if (kind === 'contact' && stop.id === 'contacts') completeStop('contacts')
      if (kind === 'deal' && stop.id === 'deals') completeStop('deals')
      if (kind === 'job' && stop.id === 'calendar') completeStop('calendar')
      if (kind === 'invoice' && stop.id === 'invoices') completeStop('invoices')
      if (kind === 'vehicle' && stop.id === 'cars') completeStop('cars')
      if (kind === 'expense' && stop.id === 'money') completeStop('money')
      if (kind === 'package' && stop.id === 'settings') completeStop('settings')
      if (kind === 'campaign' && stop.id === 'campaigns') completeStop('campaigns')
      if (kind === 'route' && stop.id === 'routes') completeStop('routes')
      if (kind === 'dashboard' && stop.id === 'dashboard') completeStop('dashboard')
      if (kind === 'settings' && stop.id === 'settings') completeStop('settings')
    },
    [active, stop.id, completeStop],
  )

  // Keep real Desk page in sync with the active stop.
  useEffect(() => {
    if (phase !== 'tour') return
    setPage(stop.page as PageId)
  }, [phase, stop.page, setPage])

  const stopDone = completed.has(stop.id)
  const canNext = invoiceFallback || !stop.requiresAction || stopDone

  const { armedTargetId, spotlightSelector } = useMemo(() => {
    if (!active) return { armedTargetId: null, spotlightSelector: '[data-tour-target="sidebar"]' }

    if (stop.id === 'dashboard') {
      return {
        armedTargetId: 'dashboard-revenue',
        spotlightSelector: '[data-tour-target="dashboard-revenue"]',
      }
    }

    if (stop.id === 'contacts') {
      return {
        armedTargetId: 'contacts-row',
        spotlightSelector: '[data-tour-target="contacts-row"]',
      }
    }

    if (stop.id === 'cars') {
      return {
        armedTargetId: 'cars-vehicle',
        spotlightSelector: '[data-tour-target="cars-vehicle"]',
      }
    }

    if (stop.id === 'deals') {
      return {
        armedTargetId: 'deals-card',
        spotlightSelector: '[data-tour-target="deals-card"]',
      }
    }

    if (stop.id === 'calendar') {
      return {
        armedTargetId: 'calendar-event',
        spotlightSelector: '[data-tour-target="calendar-event"]',
      }
    }

    if (stop.id === 'routes') {
      return {
        armedTargetId: 'routes-stop',
        spotlightSelector: '[data-tour-target="routes-stop"]',
      }
    }

    if (stop.id === 'invoices') {
      if (draftCount > 0) {
        return {
          armedTargetId: 'invoices-send',
          spotlightSelector: '[data-tour-target="invoices-send"]',
        }
      }
      // Fallback: spotlight the panel; Next is enabled via invoiceFallback.
      return {
        armedTargetId: 'invoices-create',
        spotlightSelector: '[data-tour-target="invoices-panel"]',
      }
    }

    if (stop.id === 'money') {
      return {
        armedTargetId: 'money-range',
        spotlightSelector: '[data-tour-target="money-range"]',
      }
    }

    if (stop.id === 'campaigns') {
      return {
        armedTargetId: 'campaigns-row',
        spotlightSelector: '[data-tour-target="campaigns-row"]',
      }
    }

    if (stop.id === 'settings') {
      return {
        armedTargetId: 'settings-schedule-tab',
        spotlightSelector: '[data-tour-target="settings-schedule-tab"]',
      }
    }

    const spotId = stop.spotlightTargetId ?? stop.targetId ?? 'sidebar'
    return {
      armedTargetId: stop.targetId,
      spotlightSelector: `[data-tour-target="${spotId}"]`,
    }
  }, [active, stop, draftCount])

  const isArmed = useCallback(
    (targetId: string) => {
      if (!active) return false
      if (stop.id === 'dashboard') {
        return targetId === 'dashboard-panel' || targetId === 'dashboard-revenue'
      }
      if (stop.id === 'contacts') {
        return (
          targetId === 'contacts-panel' ||
          targetId === 'contacts-table' ||
          targetId === 'contacts-row' ||
          targetId === 'contacts-add'
        )
      }
      if (stop.id === 'cars') {
        return targetId === 'cars-panel' || targetId === 'cars-vehicle'
      }
      if (stop.id === 'deals') {
        return (
          targetId === 'deals-board' ||
          targetId === 'deals-card' ||
          targetId === 'deals-action' ||
          targetId === 'deals-advance' ||
          targetId === 'deals-add'
        )
      }
      if (stop.id === 'calendar') {
        return (
          targetId === 'calendar-panel' ||
          targetId === 'calendar-new' ||
          targetId === 'calendar-event'
        )
      }
      if (stop.id === 'routes') {
        return targetId === 'routes-panel' || targetId === 'routes-stop'
      }
      if (stop.id === 'invoices') {
        return (
          targetId === 'invoices-send' ||
          targetId === 'invoices-panel' ||
          targetId === 'invoices-create'
        )
      }
      if (stop.id === 'money') {
        return targetId === 'money-panel' || targetId === 'money-range'
      }
      if (stop.id === 'campaigns') {
        return targetId === 'campaigns-panel' || targetId === 'campaigns-row'
      }
      if (stop.id === 'settings') {
        return targetId === 'settings-panel' || targetId === 'settings-schedule-tab'
      }
      return armedTargetId === targetId
    },
    [active, armedTargetId, stop.id],
  )

  const targetProps = useCallback(
    (targetId: string) => {
      const armed = isArmed(targetId)
      return {
        'data-tour-target': targetId,
        className: armed ? 'tour-armed relative z-[55] pointer-events-auto' : '',
      }
    },
    [isArmed],
  )

  const skipInvoicePhotoGate = active && stop.id === 'invoices'

  const value: TourContextValue = {
    phase,
    stopIndex,
    stop,
    total,
    active,
    sessionOpen,
    start,
    next,
    back,
    skip,
    goToStop,
    goToPhase,
    completeStop,
    isStopComplete,
    stopDone,
    canNext,
    invoiceFallback,
    armedTargetId,
    spotlightSelector,
    isArmed,
    targetProps,
    notifyCreated,
    skipInvoicePhotoGate,
    dataMode: data.mode,
    counts: {
      contacts: data.contacts.length,
      deals: data.deals.length,
      invoices: data.invoices.length,
      drafts: draftCount,
    },
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}
