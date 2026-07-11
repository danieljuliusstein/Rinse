import type { ClientInput, JobEditData, QueueItem, QuickJobData } from '@rinse/core'
import { generatePocketBaseId } from '@rinse/core'
import { ClientResponseError } from 'pocketbase'
import { refreshAuthOnce } from '../auth'
import { jobPbCreateFields } from '../job-create'
import { getPocketBase } from '../pocketbase'
import { isOnline } from '../network'
import { formatPocketBaseError } from '../pocketbase-errors'
import {
  describeQueueOperation,
  isDiscardableSyncError,
  SyncAuthError,
  SyncConflictError,
  SyncNetworkError,
} from './sync-errors'
import {
  getNextQueueItem,
  getQueueCount,
  incrementRetries,
  removeQueueItem,
} from './queue'
import { upsertMirrorRecord } from './mirror'

const MAX_RETRIES = 3

export interface SyncResult {
  processed: number
  failed: number
  remaining: number
  errors: string[]
  paused: boolean
}

function isAuthError(err: unknown): boolean {
  if (err instanceof SyncAuthError) return true
  if (err instanceof ClientResponseError && (err.status === 401 || err.status === 403)) return true
  return false
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof SyncNetworkError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /network|fetch|timeout|abort|unreachable|failed to connect/i.test(msg)
}

function withOrganization<T extends Record<string, unknown>>(
  payload: T,
  organizationId: string
): T & { organization_id: string } {
  return { ...payload, organization_id: organizationId }
}

function clientPayload(input: ClientInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    tags: input.tags ?? [],
    notes: input.notes ?? '',
    ...(input.lead_source ? { lead_source: input.lead_source } : {}),
  }
}

function jobCreatePayload(input: QuickJobData, clientId: string): Record<string, unknown> {
  return jobPbCreateFields({
    date: input.date,
    locationType: input.locationType,
    packageId: input.packageId,
    vehicleType: input.vehicleType,
    clientId,
    revenue: input.revenue,
    tip: input.tip,
    start_time: input.start_time,
    notes: input.notes,
    travel_cost: input.travel_cost,
    marketing_cost: input.marketing_cost,
    equipment_depreciation: input.equipment_depreciation,
    recurrence_cadence: input.recurrence_cadence,
    recurrence_anchor_date: input.recurrence_anchor_date,
  })
}

async function assertNoConflict(collection: string, id: string, localUpdated?: string): Promise<void> {
  if (!localUpdated) return
  const pb = getPocketBase()
  try {
    const remote = await pb.collection(collection).getOne(id)
    const remoteUpdated = remote.updated ? String(remote.updated) : ''
    if (remoteUpdated && remoteUpdated > localUpdated) {
      throw new SyncConflictError('Server has a newer version — refresh to see latest.', remoteUpdated)
    }
  } catch (err) {
    if (err instanceof SyncConflictError) throw err
    if (err instanceof ClientResponseError && err.status === 404) return
    throw err
  }
}

async function processQueueItem(item: QueueItem): Promise<void> {
  const pb = getPocketBase()
  const op = item.operation

  switch (op.type) {
    case 'createClient': {
      const payload = withOrganization(clientPayload(op.params), op.params.organization_id)
      try {
        const created = await pb.collection('clients').create({ id: op.recordId, ...payload })
        upsertMirrorRecord('clients', op.recordId, op.params.organization_id, created as Record<string, unknown>)
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 400 && /already exists/i.test(err.message)) {
          const retryId = generatePocketBaseId()
          const created = await pb.collection('clients').create({ id: retryId, ...payload })
          upsertMirrorRecord('clients', retryId, op.params.organization_id, created as Record<string, unknown>)
          return
        }
        throw err
      }
      break
    }
    case 'updateClient': {
      await assertNoConflict('clients', op.params.id)
      const data = clientPayload(op.params.data as ClientInput)
      const updated = await pb.collection('clients').update(op.params.id, data)
      const orgId = String(updated.organization_id ?? '')
      if (orgId) upsertMirrorRecord('clients', op.params.id, orgId, updated as Record<string, unknown>)
      break
    }
    case 'createJob': {
      const clientId = op.params.clientId
      if (!clientId) throw new Error('Job create requires clientId')
      const payload = withOrganization(
        jobCreatePayload(op.params, clientId),
        op.params.organization_id
      )
      try {
        const created = await pb.collection('jobs').create({ id: op.recordId, ...payload })
        upsertMirrorRecord('jobs', op.recordId, op.params.organization_id, created as Record<string, unknown>)
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 400 && /already exists/i.test(err.message)) {
          const retryId = generatePocketBaseId()
          const created = await pb.collection('jobs').create({ id: retryId, ...payload })
          upsertMirrorRecord('jobs', retryId, op.params.organization_id, created as Record<string, unknown>)
          return
        }
        throw err
      }
      break
    }
    case 'updateJob': {
      await assertNoConflict('jobs', op.params.id)
      const data: Record<string, unknown> = {}
      const patch = op.params.data as JobEditData
      if (patch.date !== undefined) data.date = patch.date
      if (patch.status !== undefined) data.status = patch.status
      if (patch.revenue !== undefined) data.revenue = patch.revenue
      if (patch.tip !== undefined) data.tip = patch.tip
      if (patch.notes !== undefined) data.notes = patch.notes
      if (patch.start_time !== undefined) data.start_time = patch.start_time
      if (patch.locationType !== undefined) data.location_type = patch.locationType
      if (patch.vehicleType !== undefined) data.vehicle_type = patch.vehicleType
      if (patch.packageId !== undefined) data.package_id = patch.packageId
      if (patch.hours_worked !== undefined) data.hours_worked = patch.hours_worked
      const updated = await pb.collection('jobs').update(op.params.id, data)
      const orgId = String(updated.organization_id ?? '')
      if (orgId) upsertMirrorRecord('jobs', op.params.id, orgId, updated as Record<string, unknown>)
      break
    }
    case 'deleteJob': {
      try {
        await pb.collection('jobs').delete(op.params.id)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    case 'deleteClient': {
      try {
        await pb.collection('clients').delete(op.params.id)
      } catch (err) {
        if (!(err instanceof ClientResponseError && err.status === 404)) throw err
      }
      break
    }
    default:
      throw new Error(`Unsupported queue operation: ${(op as { type: string }).type}`)
  }
}

async function processOneItem(item: QueueItem, result: SyncResult): Promise<'done' | 'auth_pause' | 'network_stop'> {
  try {
    await processQueueItem(item)
    await removeQueueItem(item.id)
    result.processed++
    return 'done'
  } catch (err) {
    if (isAuthError(err)) return 'auth_pause'

    const message = formatPocketBaseError(err, 'Sync failed')
    result.failed++
    result.errors.push(`${describeQueueOperation(item.operation)}: ${message}`)

    if (isDiscardableSyncError(err)) {
      await removeQueueItem(item.id)
      return 'done'
    }

    if (isNetworkError(err)) {
      await incrementRetries(item.id)
      return 'network_stop'
    }

    await incrementRetries(item.id)
    if (item.retries + 1 >= MAX_RETRIES) {
      await removeQueueItem(item.id)
      result.errors.push(`Discarded after ${MAX_RETRIES} retries`)
    }
    return 'network_stop'
  }
}

/** Sequential queue processor — one item at a time; no setInterval. */
export async function runSyncOnce(): Promise<SyncResult> {
  const result: SyncResult = {
    processed: 0,
    failed: 0,
    remaining: 0,
    errors: [],
    paused: false,
  }

  const online = await isOnline()
  if (!online) {
    result.remaining = await getQueueCount()
    return result
  }

  await refreshAuthOnce()

  let item = await getNextQueueItem()
  while (item) {
    const outcome = await processOneItem(item, result)

    if (outcome === 'auth_pause') {
      const refreshed = await refreshAuthOnce()
      if (!refreshed) {
        result.paused = true
        result.errors.push('Authentication expired — sign in again to continue sync')
        break
      }
      const retry = await processOneItem(item, result)
      if (retry === 'auth_pause' || retry === 'network_stop') break
    } else if (outcome === 'network_stop') {
      break
    }

    item = await getNextQueueItem()
  }

  result.remaining = await getQueueCount()
  return result
}
