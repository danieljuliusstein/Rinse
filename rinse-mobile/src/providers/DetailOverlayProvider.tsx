import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DetailOverlayContext,
  type DetailOverlayTarget,
} from '@/src/providers/detail-overlay-context'

export type { DetailOverlayTarget } from '@/src/providers/detail-overlay-context'
export { useDetailOverlay } from '@/src/providers/detail-overlay-context'

interface DetailOverlayState {
  target: DetailOverlayTarget
}

/**
 * Lazy-require the panel so provider ↔ panel ↔ navigation never forms a
 * Metro require cycle (which left context hooks uninitialized and blanked the tree).
 */
function DetailOverlayPanelLazy({
  target,
  onClose,
}: {
  target: DetailOverlayTarget
  onClose: () => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DetailOverlayPanel } = require('@/src/components/detail/DetailOverlayPanel') as typeof import('@/src/components/detail/DetailOverlayPanel')
  return <DetailOverlayPanel target={target} onClose={onClose} />
}

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
      {state ? <DetailOverlayPanelLazy target={state.target} onClose={close} /> : null}
    </DetailOverlayContext.Provider>
  )
}
