import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DetailOverlayPanel } from '@/src/components/detail/DetailOverlayPanel'

export type DetailOverlayTarget =
  | { kind: 'job'; id: string }
  | { kind: 'client'; id: string }
  | { kind: 'quote'; id: string; onRefresh?: () => void }

interface DetailOverlayState {
  target: DetailOverlayTarget
}

interface DetailOverlayContextValue {
  open: (target: DetailOverlayTarget) => void
  close: () => void
  isOpen: boolean
}

const DetailOverlayContext = createContext<DetailOverlayContextValue | null>(null)

export function DetailOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DetailOverlayState | null>(null)

  const close = useCallback(() => setState(null), [])

  const open = useCallback((target: DetailOverlayTarget) => {
    setState({ target })
  }, [])

  const value = useMemo(
    () => ({
      open,
      close,
      isOpen: Boolean(state),
    }),
    [open, close, state],
  )

  return (
    <DetailOverlayContext.Provider value={value}>
      {children}
      {state ? <DetailOverlayPanel target={state.target} onClose={close} /> : null}
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
    }
  }
  return ctx
}
