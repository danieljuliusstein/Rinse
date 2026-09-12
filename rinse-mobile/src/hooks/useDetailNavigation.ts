import { useRouter } from 'expo-router'
import { useDetailOverlay } from '@/src/providers/detail-overlay-context'

export function useDetailNavigation() {
  const overlay = useDetailOverlay()
  const router = useRouter()

  return {
    openJob: (id: string) => overlay.open({ kind: 'job', id }),
    openClient: (id: string) => overlay.open({ kind: 'client', id }),
    /** Quote detail is an AppSheet route (same pattern as New quote), not the overlay panel. */
    openQuote: (id: string, _onRefresh?: () => void) => {
      router.push(`/quotes/${id}` as never)
    },
    close: overlay.close,
    isOpen: overlay.isOpen,
  }
}
