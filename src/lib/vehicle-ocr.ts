import * as FileSystem from 'expo-file-system/legacy'
import { appApiJson } from './app-api'
import { extractPlateCandidate, normalizePlate } from './plate'
import { extractVinCandidate } from './vin-decode'

export type VehicleOcrTarget = 'plate' | 'vin' | 'auto'

export interface VehicleOcrResult {
  plate: string | null
  vin: string | null
  rawText?: string
}

export async function ocrVehicleImage(
  uri: string,
  mimeType = 'image/jpeg',
  target: VehicleOcrTarget = 'auto',
): Promise<VehicleOcrResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })

  const data = await appApiJson<VehicleOcrResult & { error?: string }>('/api/vehicles/ocr', {
    method: 'POST',
    body: JSON.stringify({ image: base64, mimeType, target }),
  })

  const plate = data.plate ? normalizePlate(data.plate) : extractPlateCandidate(data.rawText ?? '')
  const vin = data.vin ? extractVinCandidate(data.vin) : extractVinCandidate(data.rawText ?? '')

  if (!plate && !vin) {
    throw new Error('Could not read a plate or VIN from that photo')
  }

  return {
    plate: plate && plate.length >= 2 ? plate : null,
    vin,
    rawText: data.rawText,
  }
}
