export class SyncAuthError extends Error {
  constructor(message = 'Authentication expired') {
    super(message)
    this.name = 'SyncAuthError'
  }
}

export class SyncNetworkError extends Error {
  constructor(message = 'Network unreachable') {
    super(message)
    this.name = 'SyncNetworkError'
  }
}

export class SyncValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncValidationError'
  }
}

export class SyncConflictError extends Error {
  readonly serverUpdated?: string

  constructor(message: string, serverUpdated?: string) {
    super(message)
    this.name = 'SyncConflictError'
    this.serverUpdated = serverUpdated
  }
}

export function isDiscardableSyncError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  if (/Unknown job:/i.test(msg)) return true
  if (/Job not found on server/i.test(msg)) return true
  if (/Unknown package:/i.test(msg)) return true
  if (/Unknown client:/i.test(msg)) return true
  if (/not found/i.test(msg)) return true
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status
    if (status === 404) return true
  }
  return false
}

import type { QueueOperation } from '@rinse/core'

export function describeQueueOperation(op: QueueOperation): string {
  if (op.type === 'createClient' || op.type === 'createJob') return `${op.type} ${op.recordId}`
  if (op.type === 'createDamageDoc') return `${op.type} ${op.localDamageId}`
  if (op.type === 'createVehicle') return `${op.type} ${op.localVehicleId}`
  if (op.type === 'uploadJobPhoto') return `${op.type} ${op.params.jobId}`
  if (op.type === 'createInvoiceForJob') return `${op.type} ${op.params.jobId}`
  if ('params' in op && op.params && 'id' in op.params) return `${op.type} ${String(op.params.id)}`
  if ('params' in op && op.params && 'invoiceId' in op.params) {
    return `${op.type} ${String(op.params.invoiceId)}`
  }
  return op.type
}
