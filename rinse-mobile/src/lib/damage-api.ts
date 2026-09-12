import type { DamageRecord, DamageRecordInput, Vehicle, VehicleInput } from '@rinse/core'
import { generatePocketBaseId } from '@rinse/core'
import { appendPhotoToFormData } from './form-data-file'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { isOfflineWritesEnabled } from './subscription-fetch'
import { enqueue } from './offline/queue'
import { fileUriToDataUrl } from './offline/sync-files'

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
    uploaded_at: record.uploaded_at
      ? String(record.uploaded_at)
      : record.created
        ? String(record.created)
        : undefined,
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

export async function getDamageDocsForJob(jobId: string): Promise<DamageRecord[]> {
  if (!(await isOnline())) return []
  const escaped = jobId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  try {
    const records = await pb().collection('damage_docs').getFullList({
      filter: `job_id = "${escaped}"`,
      sort: '-uploaded_at,-created',
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
  const orgId = requireOrganizationId()
  const offlineEnabled = await isOfflineWritesEnabled()
  const online = await isOnline()

  const tryOnline = async (): Promise<DamageRecord> => {
    const formData = new FormData()
    formData.append('organization_id', orgId)
    formData.append('vehicle_id', input.vehicle_id)
    formData.append('area', input.area)
    formData.append('note', input.note)
    formData.append('date', input.date)
    // Device-reported capture time only — server sets uploaded_at.
    formData.append('captured_at', input.captured_at)
    if (input.linked_job_id) formData.append('job_id', input.linked_job_id)
    await appendPhotoToFormData(formData, 'photo', fileUri, filename, mimeType)

    try {
      const record = await pb().collection('damage_docs').create(formData)
      return mapDamage(record as Record<string, unknown>)
    } catch (err) {
      // Surface PocketBase validation details when present.
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { message?: string; data?: Record<string, { message?: string }> } })
          .response
        const fieldMsg = response?.data
          ? Object.entries(response.data)
              .map(([k, v]) => (v?.message ? `${k}: ${v.message}` : null))
              .filter(Boolean)
              .join('; ')
          : ''
        if (fieldMsg || response?.message) {
          throw new Error(fieldMsg || response?.message || 'Upload failed')
        }
      }
      throw err
    }
  }

  if (online) {
    try {
      return await tryOnline()
    } catch (err) {
      if (!offlineEnabled) throw err
      const msg = err instanceof Error ? err.message : String(err)
      if (!/network|fetch|timeout|abort|unreachable|failed to connect/i.test(msg)) throw err
    }
  }

  if (!offlineEnabled) {
    throw new Error('Uploading damage photos requires an internet connection')
  }

  const localDamageId = generatePocketBaseId()
  const photo_url = await fileUriToDataUrl(fileUri, mimeType)
  await enqueue({
    type: 'createDamageDoc',
    params: { ...input, photo_url },
    localDamageId,
  })

  return {
    id: localDamageId,
    vehicle_id: input.vehicle_id,
    area: input.area,
    note: input.note,
    date: input.date,
    captured_at: input.captured_at,
    /** Pending sync — UI should label as "Uploading…" until server stamp lands. */
    uploaded_at: undefined,
    photo_url: fileUri,
    linked_job_id: input.linked_job_id,
  }
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
