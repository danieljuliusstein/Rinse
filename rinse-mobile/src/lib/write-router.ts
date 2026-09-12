import type { QueueOperation } from '@rinse/core'
import { isOnline } from './network'
import { isOfflineWritesEnabled } from './subscription-fetch'
import { enqueue } from './offline/queue'
import { deleteMirrorRecord, upsertMirrorRecord } from './offline/mirror'
import { requireOrganizationIdForWrite } from './org-write'
import { formatPocketBaseError } from './pocketbase-errors'

interface WriteTarget<T> {
  recordId: string
  collection: 'clients' | 'jobs'
  mirrorData: Record<string, unknown>
  pocketbase: () => Promise<T>
  buildQueue: () => QueueOperation
}

export async function executeWrite<T>(target: WriteTarget<T>): Promise<T> {
  const orgId = await requireOrganizationIdForWrite()
  const offlineEnabled = await isOfflineWritesEnabled()

  upsertMirrorRecord(target.collection, target.recordId, orgId, {
    ...target.mirrorData,
    id: target.recordId,
    organization_id: orgId,
    updated: new Date().toISOString(),
  })

  const online = await isOnline()
  if (online) {
    try {
      const result = await target.pocketbase()
      return result
    } catch (err) {
      deleteMirrorRecord(target.collection, target.recordId)
      if (!offlineEnabled) {
        throw new Error(formatPocketBaseError(err, 'Could not save changes'))
      }
      const msg = err instanceof Error ? err.message : String(err)
      if (!/network|fetch|timeout|abort|unreachable/i.test(msg)) {
        throw new Error(formatPocketBaseError(err, 'Could not save changes'))
      }
    }
  }

  if (!offlineEnabled) {
    deleteMirrorRecord(target.collection, target.recordId)
    throw new Error('You are offline. Connect to the internet to save changes.')
  }

  await enqueue(target.buildQueue())
  return target.mirrorData as T
}
