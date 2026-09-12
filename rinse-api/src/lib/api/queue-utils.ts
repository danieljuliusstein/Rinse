import { DEMO_JOB_IDS, isDemoJobId } from '../demo-data'
import { getQueueItems, removeQueueItem, type QueueItem, type QueueOperation } from '../offline-queue'

function opReferencesJob(op: QueueOperation, jobId: string): boolean {
  switch (op.type) {
    case 'createJob':
      return op.localJobId === jobId
    case 'updateJob':
      return op.params.id === jobId
    case 'deleteJob':
      return op.params.id === jobId
    case 'deleteClient':
      return false
    case 'createInvoiceForJob':
      return op.params.jobId === jobId
    case 'uploadJobPhoto':
    case 'deleteJobPhoto':
      return op.params.jobId === jobId
    default:
      return false
  }
}

function isStaleQueueItem(item: QueueItem): boolean {
  const op = item.operation
  for (const demoId of DEMO_JOB_IDS) {
    if (opReferencesJob(op, demoId)) return true
  }
  if (op.type === 'deleteJob' && isDemoJobId(op.params.id)) return true
  if (op.type === 'updateJob' && isDemoJobId(op.params.id)) return true
  if (op.type === 'createInvoiceForJob' && isDemoJobId(op.params.jobId)) return true
  if (op.type === 'uploadJobPhoto' && isDemoJobId(op.params.jobId)) return true
  if (op.type === 'deleteJobPhoto' && isDemoJobId(op.params.jobId)) return true
  return false
}

export function isDiscardableQueueError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  if (/Unknown job:/i.test(msg)) return true
  if (/Job not found on server/i.test(msg)) return true
  if (/Unknown package:/i.test(msg)) return true
  if (/Unknown client:/i.test(msg)) return true
  if (/Unknown invoice:/i.test(msg)) return true
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status
    if (status === 404) return true
  }
  return false
}

export function describeQueueItem(item: QueueItem): string {
  const op = item.operation
  switch (op.type) {
    case 'updateJob':
      return `update job ${op.params.id}`
    case 'deleteJob':
      return `delete job ${op.params.id}`
    case 'deleteClient':
      return `delete client ${op.params.id}`
    case 'createInvoiceForJob':
      return `invoice for job ${op.params.jobId}`
    case 'createJob':
      return `create job ${op.localJobId}`
    default:
      return op.type
  }
}

/** Drop queued writes that reference demo jobs or other stale local IDs. */
export async function purgeStaleQueueItems(): Promise<number> {
  const items = await getQueueItems()
  let removed = 0
  for (const item of items) {
    if (isStaleQueueItem(item)) {
      await removeQueueItem(item.id)
      removed++
    }
  }
  return removed
}

/** Remove pending sync ops for a deleted job (create/update/photos/invoices). */
export async function purgeQueueItemsForJob(jobId: string): Promise<number> {
  const items = await getQueueItems()
  let removed = 0
  for (const item of items) {
    if (opReferencesJob(item.operation, jobId)) {
      await removeQueueItem(item.id)
      removed++
    }
  }
  return removed
}

function opReferencesClient(
  op: QueueOperation,
  clientId: string,
  jobIds: Set<string>,
  vehicleIds: Set<string>
): boolean {
  switch (op.type) {
    case 'createJob':
      return op.params.clientId === clientId || jobIds.has(op.localJobId)
    case 'createVehicle':
      return op.params.client_id === clientId || vehicleIds.has(op.localVehicleId)
    case 'createDamageDoc':
      return vehicleIds.has(op.params.vehicle_id) || Boolean(op.params.linked_job_id && jobIds.has(op.params.linked_job_id))
    case 'deleteClient':
      return op.params.id === clientId
    default:
      return false
  }
}

/** Remove pending sync ops for a deleted client and its related records. */
export async function purgeQueueItemsForClient(
  clientId: string,
  jobIds: string[],
  vehicleIds: string[]
): Promise<number> {
  const jobIdSet = new Set(jobIds)
  const vehicleIdSet = new Set(vehicleIds)
  const items = await getQueueItems()
  let removed = 0
  for (const item of items) {
    const op = item.operation
    if (
      opReferencesClient(op, clientId, jobIdSet, vehicleIdSet) ||
      jobIds.some((jobId) => opReferencesJob(op, jobId))
    ) {
      await removeQueueItem(item.id)
      removed++
    }
  }
  return removed
}
