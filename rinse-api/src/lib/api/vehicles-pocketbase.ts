import { getPocketBase } from '../pocketbase'
import { isMissingCollectionError } from './pb-errors'
import { appVehicleToPb, escapeFilterValue, pbVehicleToApp, type PbRecord } from './mappers'
import { tenantFilter, withOrganization } from './tenant-pocketbase'
import type { Vehicle, VehicleInput } from '../types'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function vehiclePhotoUrl(record: PbRecord): string | null {
  const photo = record.photo
  if (!photo || (Array.isArray(photo) && photo.length === 0)) return null
  const filename = Array.isArray(photo) ? photo[0] : String(photo)
  return pb().files.getURL(record, filename)
}

export async function getVehiclesForClient(clientId: string): Promise<Vehicle[]> {
  try {
    const records = await pb()
      .collection('vehicles')
      .getFullList<PbRecord>({
        filter: tenantFilter(`client_id = "${escapeFilterValue(clientId)}"`),
        sort: '-id',
      })
    return records.map((r) => pbVehicleToApp(r, vehiclePhotoUrl(r)))
  } catch (err) {
    if (isMissingCollectionError(err)) {
      console.warn(
        '[vehicles] PocketBase returned 404 for vehicles collection. ' +
          'If you recently ran migrations, restart PocketBase: cd pocketbase && ./pocketbase serve --http=127.0.0.1:8090'
      )
      return []
    }
    throw err
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  try {
    const record = await pb().collection('vehicles').getOne<PbRecord>(id)
    return pbVehicleToApp(record, vehiclePhotoUrl(record))
  } catch (err) {
    if (isMissingCollectionError(err)) return null
    return null
  }
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  try {
    const record = await pb().collection('vehicles').create<PbRecord>(withOrganization(appVehicleToPb(input)))
    return pbVehicleToApp(record, vehiclePhotoUrl(record))
  } catch (err) {
    if (isMissingCollectionError(err)) {
      throw new Error(
        'Vehicles are not set up on the server yet. Ask your admin to run PocketBase migrations (vehicles collection missing).'
      )
    }
    throw err
  }
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle | null> {
  try {
    const current = await getVehicle(id)
    if (!current) return null
    const merged = { ...current, ...input }
    const record = await pb().collection('vehicles').update<PbRecord>(id, appVehicleToPb(merged))
    return pbVehicleToApp(record, vehiclePhotoUrl(record))
  } catch {
    return null
  }
}
