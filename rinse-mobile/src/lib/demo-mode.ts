import { deleteSecureItem, getSecureItem, setSecureItem } from '@/src/lib/secure-storage'

const STORAGE_KEY = 'rinse_demo_mode_v1'

export async function isDemoModeEnabled(): Promise<boolean> {
  try {
    return (await getSecureItem(STORAGE_KEY)) === '1'
  } catch {
    return false
  }
}

export async function setDemoModeEnabled(enabled: boolean): Promise<void> {
  if (enabled) await setSecureItem(STORAGE_KEY, '1')
  else await deleteSecureItem(STORAGE_KEY)
}
