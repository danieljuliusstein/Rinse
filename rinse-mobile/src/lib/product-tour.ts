import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage'

const TOUR_COMPLETED_KEY = 'rinse_product_tour_completed'
const TOUR_PENDING_KEY = 'rinse_product_tour_pending'
const TOUR_REPLAY_KEY = 'rinse_product_tour_replay'
const TOUR_WELCOME_DISMISSED_KEY = 'rinse_product_tour_welcome_dismissed'

export async function markTourPending(): Promise<void> {
  await deleteSecureItem(TOUR_COMPLETED_KEY)
  await deleteSecureItem(TOUR_WELCOME_DISMISSED_KEY)
  await setSecureItem(TOUR_PENDING_KEY, '1')
}

export async function isTourCompleted(): Promise<boolean> {
  return (await getSecureItem(TOUR_COMPLETED_KEY)) === '1'
}

export async function markTourCompleted(): Promise<void> {
  await setSecureItem(TOUR_COMPLETED_KEY, '1')
  await deleteSecureItem(TOUR_PENDING_KEY)
  await deleteSecureItem(TOUR_REPLAY_KEY)
}

export async function isTourReplayRequested(): Promise<boolean> {
  return (await getSecureItem(TOUR_REPLAY_KEY)) === '1'
}

export async function shouldAutoStartTour(): Promise<boolean> {
  if (await isTourCompleted()) {
    return await isTourReplayRequested()
  }
  return (await getSecureItem(TOUR_PENDING_KEY)) === '1' || (await isTourReplayRequested())
}

export function dismissTourWelcome(): void {
  void setSecureItem(TOUR_WELCOME_DISMISSED_KEY, '1')
}

export async function shouldShowTourWelcome(): Promise<boolean> {
  if (!(await shouldAutoStartTour())) return false
  if (await isTourReplayRequested()) return false
  return (await getSecureItem(TOUR_WELCOME_DISMISSED_KEY)) !== '1'
}
