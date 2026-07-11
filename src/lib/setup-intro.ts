import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage'

const INTRO_SEEN_KEY = 'rinse_setup_intro_seen'

export async function hasSeenSetupIntro(): Promise<boolean> {
  return (await getSecureItem(INTRO_SEEN_KEY)) === '1'
}

export async function markSetupIntroSeen(): Promise<void> {
  await setSecureItem(INTRO_SEEN_KEY, '1')
}

export async function clearSetupIntroSeen(): Promise<void> {
  await deleteSecureItem(INTRO_SEEN_KEY)
}
