import { useDetailOverlay } from '@/src/providers/DetailOverlayProvider'

export function useDetailNavigation() {
  const overlay = useDetailOverlay()

  return {
    openJob: (id: string) => overlay.open({ kind: 'job', id }),
    openClient: (id: string) => overlay.open({ kind: 'client', id }),
    openQuote: (id: string, onRefresh?: () => void) => overlay.open({ kind: 'quote', id, onRefresh }),
    close: overlay.close,
    isOpen: overlay.isOpen,
  }
}
