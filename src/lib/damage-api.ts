import type { DamageRecord, DamageRecordInput, Vehicle, VehicleInput } from '@rinse/core'
import { generatePocketBaseId } from '@rinse/core'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'

function pb() {
  const client = getPocketBase()
  if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function mapVehicle(record: Record<string, unknown>): Vehicle {
  return {
    id: String(record.id),
    client_id: String(record.client_id ?? ''),
    year: record.year != null ? Number(record.year) : undefined,
    make: String(record.make ?? ''),
    model: String(record.model ?? ''),
    color: record.color ? String(record.color) : undefined,
    color_hex: record.color_hex ? String(record.color_hex) : undefined,
    vin: record.vin ? String(record.vin) : undefined,
    plate: record.plate ? String(record.plate) : undefined,
    type: (record.type as Vehicle['type']) ?? 'sedan',
    photo_url: record.photo_url ? String(record.photo_url) : undefined,
    created: record.created ? String(record.created) : undefined,
  }
}

function damagePhotoUrl(record: Record<string, unknown>): string | null {
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return null
  const filename = Array.isArray(photo) ? photo[0] : String(photo)
  return pb().files.getURL(record, filename)
}

function mapDamage(record: Record<string, unknown>): DamageRecord {
  return {
    id: String(record.id),
    vehicle_id: String(record.vehicle_id ?? ''),
    area: String(record.area ?? ''),
    note: String(record.note ?? ''),
    date: String(record.date ?? ''),
    captured_at: String(record.captured_at ?? ''),
    photo_url: damagePhotoUrl(record),
    linked_job_id: record.job_id ? String(record.job_id) : undefined,
  }
}

export async function listVehiclesForClient(clientId: string): Promise<Vehicle[]> {
  if (!(await isOnline())) return []
  const escaped = clientId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb().collection('vehicles').getFullList({
    filter: `client_id = "${escaped}"`,
    sort: '-id',
  })
  return records.map((r) => mapVehicle(r as Record<string, unknown>))
}

/** All org vehicles — used to enrich job search (make/color/plate/VIN). */
export async function listAllVehicles(): Promise<Vehicle[]> {
  if (!(await isOnline())) return []
  const orgId = requireOrganizationId()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  try {
    const records = await pb().collection('vehicles').getFullList({
      filter: `organization_id = "${escaped}"`,
      sort: '-id',
    })
    return records.map((r) => mapVehicle(r as Record<string, unknown>))
  } catch {
    return []
  }
}

export function groupVehiclesByClient(vehicles: Vehicle[]): Map<string, Vehicle[]> {
  const map = new Map<string, Vehicle[]>()
  for (const vehicle of vehicles) {
    const list = map.get(vehicle.client_id) ?? []
    list.push(vehicle)
    map.set(vehicle.client_id, list)
  }
  return map
}

export async function getDamageDocsForVehicle(vehicleId: string): Promise<DamageRecord[]> {
  if (!(await isOnline())) return []
  const escaped = vehicleId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  try {
    const records = await pb().collection('damage_docs').getFullList({
      filter: `vehicle_id = "${escaped}"`,
      sort: '-date',
    })
    return records.map((r) => mapDamage(r as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function createDamageDoc(
  input: DamageRecordInput,
  fileUri: string,
  filename: string,
  mimeType: string
): Promise<DamageRecord> {
  if (!(await isOnline())) throw new Error('Uploading damage photos requires an internet connection')

  const orgId = requireOrganizationId()
  const formData = new FormData()
  formData.append('organization_id', orgId)
  formData.append('vehicle_id', input.vehicle_id)
  formData.append('area', input.area)
  formData.append('note', input.note)
  formData.append('date', input.date)
  formData.append('captured_at', input.captured_at)
  if (input.linked_job_id) formData.append('job_id', input.linked_job_id)
  formData.append('photo', { uri: fileUri, name: filename, type: mimeType } as unknown as Blob)

  const record = await pb().collection('damage_docs').create(formData)
  return mapDamage(record as Record<string, unknown>)
}

export function vehicleDisplayName(vehicle: Vehicle): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean)
  return parts.join(' ') || 'Vehicle'
}

export async function getVehicle(clientId: string, vehicleId: string): Promise<Vehicle | null> {
  const vehicles = await listVehiclesForClient(clientId)
  return vehicles.find((v) => v.id === vehicleId) ?? null
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  if (!(await isOnline())) throw new Error('Creating vehicles requires an internet connection')
  const orgId = requireOrganizationId()
  const id = generatePocketBaseId()
  const record = await pb().collection('vehicles').create({
    id,
    organization_id: orgId,
    client_id: input.client_id,
    year: input.year ?? null,
    make: input.make,
    model: input.model,
    color: input.color ?? '',
    color_hex: input.color_hex ?? '',
    vin: input.vin ?? '',
    plate: input.plate ?? '',
    type: input.type ?? 'sedan',
  })
  return mapVehicle(record as Record<string, unknown>)
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle | null> {
  if (!(await isOnline())) return null
  try {
    const record = await pb().collection('vehicles').update(id, {
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.make !== undefined ? { make: input.make } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.color_hex !== undefined ? { color_hex: input.color_hex } : {}),
      ...(input.vin !== undefined ? { vin: input.vin } : {}),
      ...(input.plate !== undefined ? { plate: input.plate } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
    })
    return mapVehicle(record as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function deleteVehicle(id: string): Promise<boolean> {
  if (!(await isOnline())) return false
  try {
    await pb().collection('vehicles').delete(id)
    return true
  } catch {
    return false
  }
}
