import { getPocketBase } from '../pocketbase'
import { isMissingCollectionError } from './pb-errors'
import { appDamageToPb, escapeFilterValue, pbDamageToApp, type PbRecord } from './mappers'
import { tenantFilter, withOrganization } from './tenant-pocketbase'
import type { DamageRecord, DamageRecordInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function damagePhotoUrl(record: PbRecord): string | null {
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return null
  const filename = Array.isArray(photo) ? photo[0] : String(photo)
  return pb().files.getURL(record, filename)
}

export async function getDamageDocsForVehicle(vehicleId: string): Promise<DamageRecord[]> {
  try {
    const records = await pb()
      .collection('damage_docs')
      .getFullList<PbRecord>({
        filter: tenantFilter(`vehicle_id = "${escapeFilterValue(vehicleId)}"`),
        sort: '-date',
      })
    return records.map((r) => pbDamageToApp(r, damagePhotoUrl(r)))
  } catch (err) {
    if (isMissingCollectionError(err)) return []
    throw err
  }
}

export async function getDamageDoc(id: string): Promise<DamageRecord | null> {
  try {
    const record = await pb().collection('damage_docs').getOne<PbRecord>(id)
    return pbDamageToApp(record, damagePhotoUrl(record))
  } catch (err) {
    if (isMissingCollectionError(err)) return null
    return null
  }
}

export async function createDamageDoc(
  input: DamageRecordInput,
  photoFile?: File | null
): Promise<DamageRecord> {
  const formData = new FormData()
  const payload = withOrganization(appDamageToPb(input))
  for (const [key, value] of Object.entries(payload)) {
    if (value !== '' && value != null) formData.append(key, String(value))
  }
  if (photoFile) formData.append('photo', photoFile)

  const record = await pb().collection('damage_docs').create<PbRecord>(formData)
  return pbDamageToApp(record, damagePhotoUrl(record))
}

export async function updateDamageDocNote(id: string, note: string): Promise<DamageRecord | null> {
  try {
    const record = await pb().collection('damage_docs').update<PbRecord>(id, { note })
    return pbDamageToApp(record, damagePhotoUrl(record))
  } catch (err) {
    if (isMissingCollectionError(err)) return null
    return null
  }
}

export async function deleteDamageDoc(id: string): Promise<boolean> {
  try {
    await pb().collection('damage_docs').delete(id)
    return true
  } catch (err) {
    if (isMissingCollectionError(err)) return false
    return false
  }
}

/** Convert a data URL from session storage into a File for PocketBase upload. */
export async function dataUrlToFile(dataUrl: string, filename = 'damage.jpg'): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const type = blob.type || 'image/jpeg'
  return new File([blob], filename, { type })
}
