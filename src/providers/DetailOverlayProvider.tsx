'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import DetailOverlayPanel from '@/components/detail/DetailOverlayPanel'

export type DetailOverlayTarget =
  | { kind: 'job'; id: string }
  | { kind: 'client'; id: string }
  | { kind: 'invoice'; jobId: string }

interface DetailOverlayState {
  target: DetailOverlayTarget
  layoutId: string
}

interface DetailOverlayContextValue {
  open: (target: DetailOverlayTarget, layoutId: string) => void
  close: () => void
  isOpen: boolean
  activeLayoutId: string | null
}

const DetailOverlayContext = createContext<DetailOverlayContextValue | null>(null)

export function DetailOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DetailOverlayState | null>(null)

  const close = useCallback(() => setState(null), [])

  const open = useCallback((target: DetailOverlayTarget, layoutId: string) => {
    setState({ target, layoutId })
  }, [])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  const value = useMemo(
    () => ({
      open,
      close,
      isOpen: Boolean(state),
      activeLayoutId: state?.layoutId ?? null,
    }),
    [open, close, state],
  )

  return (
    <DetailOverlayContext.Provider value={value}>
      {children}
      {state ? <DetailOverlayPanel target={state.target} layoutId={state.layoutId} onClose={close} /> : null}
    </DetailOverlayContext.Provider>
  )
}

export function useDetailOverlay() {
  const ctx = useContext(DetailOverlayContext)
  if (!ctx) {
    return {
      open: () => {},
      close: () => {},
      isOpen: false,
      activeLayoutId: null,
    }
  }
  return ctx
}
