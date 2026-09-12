import { enqueue, type QueueOperation } from '../offline-queue'
import { isPocketBaseConfigured } from '../pocketbase'
import { assertCanWrite } from '../write-guard'

let writeDegraded = false

export function isWriteDegraded(): boolean {
  return writeDegraded
}

export function clearWriteDegraded(): void {
  writeDegraded = false
}

interface WriteTarget<T> {
  resolvedBackend: 'local' | 'pocketbase'
  local: () => T | Promise<T>
  pocketbase: () => Promise<T>
  buildQueue: (result: T) => QueueOperation | null | Promise<QueueOperation | null>
}

export async function executeWrite<T>(target: WriteTarget<T>): Promise<T> {
  assertCanWrite()
  const shouldQueue = isPocketBaseConfigured()

  if (target.resolvedBackend === 'local') {
    const result = await target.local()
    if (shouldQueue) {
      const op = await target.buildQueue(result)
      if (op) await enqueue(op)
    }
    return result
  }

  try {
    return await target.pocketbase()
  } catch (err) {
    const online = typeof navigator === 'undefined' || navigator.onLine
    if (online) throw err
    console.warn('[api] PocketBase write failed offline, queuing for sync:', err)
    const result = await target.local()
    if (shouldQueue) {
      const op = await target.buildQueue(result)
      if (op) await enqueue(op)
    }
    writeDegraded = true
    return result
  }
}
