import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo-modules-core'

type MlkitOcrNative = {
  isSupported: () => boolean
  recognizeText: (uri: string) => Promise<{ text?: string }>
}

function loadMlkitOcr(): MlkitOcrNative | null {
  if (Platform.OS === 'web') return null
  try {
    return requireOptionalNativeModule<MlkitOcrNative>('ExpoMlkitOcr') ?? null
  } catch {
    return null
  }
}

export function isOnDeviceReceiptOcrAvailable(): boolean {
  if (Platform.OS === 'web') return false
  const mod = loadMlkitOcr()
  if (!mod) return false
  try {
    return mod.isSupported()
  } catch {
    return false
  }
}

/** Raw multiline OCR text, or null when unavailable / empty. Never calls the API. */
export async function recognizeReceiptText(uri: string): Promise<string | null> {
  if (!uri || uri.startsWith('blob:') || uri.startsWith('data:')) return null
  if (!isOnDeviceReceiptOcrAvailable()) return null
  const mod = loadMlkitOcr()
  if (!mod) return null
  try {
    const recognition = await mod.recognizeText(uri)
    const raw = recognition.text?.trim() || ''
    return raw.length ? raw : null
  } catch {
    return null
  }
}
