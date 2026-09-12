import { createContext, useContext } from 'react'

export type DetailOverlayTarget =
  | { kind: 'job'; id: string }
  | { kind: 'client'; id: string }
  | { kind: 'quote'; id: string; onRefresh?: () => void }

export interface DetailOverlayContextValue {
  open: (target: DetailOverlayTarget) => void
  close: () => void
  isOpen: boolean
}

export const DetailOverlayContext = createContext<DetailOverlayContextValue | null>(null)

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
