import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage'
import { markTourPending } from './product-tour'

const TOUR_REPLAY_KEY = 'rinse_product_tour_replay'

type TourReplayListener = () => void
const replayListeners = new Set<TourReplayListener>()

export async function requestTourReplay(): Promise<void> {
  await setSecureItem(TOUR_REPLAY_KEY, '1')
  await markTourPending()
}

export async function consumeTourReplay(): Promise<boolean> {
  const value = await getSecureItem(TOUR_REPLAY_KEY)
  if (value !== '1') return false
  await deleteSecureItem(TOUR_REPLAY_KEY)
  return true
}

export function subscribeTourReplay(listener: TourReplayListener): () => void {
  replayListeners.add(listener)
  return () => replayListeners.delete(listener)
}

export function dispatchTourReplayEvent(): void {
  for (const listener of replayListeners) listener()
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('rinse-product-tour-replay'))
  }
}
