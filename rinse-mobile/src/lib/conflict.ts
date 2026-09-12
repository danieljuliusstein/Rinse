import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { getMirrorUpdated, upsertMirrorRecord } from './offline/mirror'
import { isServerRecordNewer } from './sync-conflict.logic'

export interface RecordConflict {
  hasConflict: boolean
  serverUpdated?: string
  localUpdated?: string
}

export async function checkRecordConflict(
  collection: 'clients' | 'jobs',
  id: string
): Promise<RecordConflict> {
  const localUpdated = getMirrorUpdated(collection, id)
  if (!localUpdated) return { hasConflict: false }

  const online = await isOnline()
  if (!online) return { hasConflict: false, localUpdated }

  try {
    const pb = getPocketBase()
    const remote = await pb.collection(collection).getOne(id)
    const serverUpdated = remote.updated ? String(remote.updated) : ''
    if (isServerRecordNewer(serverUpdated, localUpdated)) {
      return { hasConflict: true, serverUpdated, localUpdated }
    }
    return { hasConflict: false, serverUpdated, localUpdated }
  } catch {
    return { hasConflict: false, localUpdated }
  }
}

/** Replace local mirror with latest server record (conflict resolution: accept server). */
export async function refreshRecordFromServer(
  collection: 'clients' | 'jobs',
  id: string,
  organizationId: string
): Promise<Record<string, unknown>> {
  const pb = getPocketBase()
  const remote = await pb.collection(collection).getOne(id, {
    expand: collection === 'jobs' ? 'client_id,package_id' : undefined,
  })
  upsertMirrorRecord(collection, id, organizationId, remote as Record<string, unknown>)
  return remote as Record<string, unknown>
}
