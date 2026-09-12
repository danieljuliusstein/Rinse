import { getSecureItem, setSecureItem } from './secure-storage'

export type AppearanceMode = 'light' | 'dark'

const APPEARANCE_KEY = 'rinse_appearance'

export async function loadAppearance(): Promise<AppearanceMode> {
  const value = await getSecureItem(APPEARANCE_KEY)
  return value === 'dark' ? 'dark' : 'light'
}

export async function saveAppearance(mode: AppearanceMode): Promise<void> {
  await setSecureItem(APPEARANCE_KEY, mode)
}
