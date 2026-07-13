import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo-modules-core'
import { extractPlateCandidate } from './plate'
import { extractVinCandidate } from './vin-decode'

export type VehicleOcrTarget = 'plate' | 'vin' | 'auto'

export interface VehicleOcrResult {
  plate: string | null
  vin: string | null
  rawText?: string
}

type MlkitOcrNative = {
  isSupported: () => boolean
  recognizeText: (uri: string) => Promise<{ text?: string }>
}

/**
 * Prefer optional native lookup — never import expo-mlkit-ocr's default export,
 * which calls requireNativeModule and redboxes when the binary is stale.
 */
function loadMlkitOcr(): MlkitOcrNative | null {
  if (Platform.OS === 'web') return null
  try {
    const native = requireOptionalNativeModule<MlkitOcrNative>('ExpoMlkitOcr')
    return native ?? null
  } catch {
    return null
  }
}

/** True when on-device OCR (Apple Vision / ML Kit) is linked in this binary. */
export function isOnDeviceVehicleOcrAvailable(): boolean {
  if (Platform.OS === 'web') return false
  const mod = loadMlkitOcr()
  if (!mod) return false
  try {
    return mod.isSupported()
  } catch {
    return false
  }
}

function bestPlateFromText(rawText: string): string | null {
  const fromWhole = extractPlateCandidate(rawText)
  // Prefer shorter plate-like tokens from individual lines (full blob can glue words).
  let best: string | null = null
  for (const line of rawText.split(/\r?\n/)) {
    const hit = extractPlateCandidate(line)
    if (!hit) continue
    if (!best || hit.length < best.length || (hit.length === best.length && hit.length >= 5 && hit.length <= 8)) {
      best = hit
    }
  }
  if (best) return best
  return fromWhole
}

/**
 * On-device OCR for plate/VIN photos.
 * iOS: Apple Vision via expo-mlkit-ocr (iosEngine: vision).
 * Android: ML Kit Text Recognition.
 * Web: not supported — use manual entry or a native build.
 */
export async function ocrVehicleImage(
  uri: string,
  _mimeType = 'image/jpeg',
  target: VehicleOcrTarget = 'auto',
  _base64?: string | null,
): Promise<VehicleOcrResult> {
  if (Platform.OS === 'web') {
    throw new Error('Photo scan needs the iOS or Android app')
  }

  const mod = loadMlkitOcr()
  if (!mod) {
    throw new Error('On-device OCR needs a rebuilt native app. Run: npx expo run:ios')
  }

  let supported = false
  try {
    supported = mod.isSupported()
  } catch {
    supported = false
  }
  if (!supported) {
    throw new Error('On-device OCR is not available on this device. Rebuild the app with expo-mlkit-ocr.')
  }

  if (!uri || uri.startsWith('blob:') || uri.startsWith('data:')) {
    throw new Error('Could not read that photo — try Capture again or pick from the library')
  }

  const recognition = await mod.recognizeText(uri)
  const rawText = recognition.text?.trim() || ''
  if (!rawText) {
    throw new Error('Could not read a plate or VIN from that photo')
  }

  const plate = target === 'vin' ? null : bestPlateFromText(rawText)
  const vin = target === 'plate' ? null : extractVinCandidate(rawText)

  if (target === 'plate' && !plate) {
    throw new Error('Could not read a license plate')
  }
  if (target === 'vin' && !vin) {
    throw new Error('Could not read a VIN')
  }
  if (!plate && !vin) {
    throw new Error('Could not read a plate or VIN from that photo')
  }

  return {
    plate: plate && plate.length >= 2 ? plate : null,
    vin,
    rawText,
  }
}
