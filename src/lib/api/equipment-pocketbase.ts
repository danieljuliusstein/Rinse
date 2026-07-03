import { getPocketBase } from '../pocketbase'
import { pocketBasePhotoFilename } from '../inventory-photo-url'
import { appEquipmentToPb, pbEquipmentToApp, type PbRecord } from './mappers'
import { withOrganization } from './tenant-pocketbase'
import type { Equipment, EquipmentInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function equipmentPhotoUrl(record: PbRecord): string | undefined {
  const filename = pocketBasePhotoFilename(record.photo)
  if (!filename) return undefined
  return pb().files.getURL(record, filename)
}

export async function getEquipment(): Promise<Equipment[]> {
  const records = await pb().collection('equipment').getFullList<PbRecord>({ sort: 'name' })
  return records.map((r) => pbEquipmentToApp(r, equipmentPhotoUrl(r)))
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  try {
    const record = await pb().collection('equipment').getOne<PbRecord>(id)
    return pbEquipmentToApp(record, equipmentPhotoUrl(record))
  } catch {
    return null
  }
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const record = await pb().collection('equipment').create<PbRecord>(
    withOrganization(appEquipmentToPb(input)),
  )
  return pbEquipmentToApp(record, equipmentPhotoUrl(record))
}

export async function updateEquipment(
  id: string,
  input: Partial<EquipmentInput>,
): Promise<Equipment | null> {
  try {
    const current = await getEquipmentItem(id)
    if (!current) return null
    const merged = { ...current, ...input }
    try {
      const record = await pb().collection('equipment').update<PbRecord>(id, appEquipmentToPb(merged))
      return pbEquipmentToApp(record, equipmentPhotoUrl(record))
    } catch {
      if (input.icon_key === undefined) return null
      const { icon_key: _iconKey, ...rest } = merged
      const record = await pb().collection('equipment').update<PbRecord>(id, appEquipmentToPb(rest))
      return pbEquipmentToApp(record, equipmentPhotoUrl(record))
    }
  } catch {
    return null
  }
}

export async function uploadEquipmentPhoto(id: string, file: File): Promise<Equipment | null> {
  try {
    const formData = new FormData()
    formData.append('photo', file)
    const record = await pb().collection('equipment').update<PbRecord>(id, formData)
    return pbEquipmentToApp(record, equipmentPhotoUrl(record))
  } catch {
    return null
  }
}

export async function clearEquipmentPhoto(id: string): Promise<Equipment | null> {
  try {
    const record = await pb().collection('equipment').update<PbRecord>(id, { photo: null })
    return pbEquipmentToApp(record, undefined)
  } catch {
    return null
  }
}

export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    await pb().collection('equipment').delete(id)
    return true
  } catch {
    return false
  }
}
