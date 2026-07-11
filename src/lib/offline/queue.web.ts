import type { QueueItem, QueueOperation } from '@rinse/core'
import { generateQueueId } from '@rinse/core'
import { webQueueStore } from './memory-store.web'

function rowToItem(row: {
  id: string
  operation: string
  created_at: string
  retries: number
}): QueueItem {
  return {
    id: row.id,
    operation: JSON.parse(row.operation) as QueueOperation,
    createdAt: row.created_at,
    retries: row.retries,
  }
}

export async function enqueue(operation: QueueOperation): Promise<QueueItem> {
  const item: QueueItem = {
    id: generateQueueId(),
    operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  }
  webQueueStore.push({
    id: item.id,
    operation: JSON.stringify(item.operation),
    created_at: item.createdAt,
    retries: item.retries,
  })
  return item
}

export async function getQueueItems(): Promise<QueueItem[]> {
  return webQueueStore.map(rowToItem)
}

export async function getQueueCount(): Promise<number> {
  return webQueueStore.length
}

export async function removeQueueItem(id: string): Promise<void> {
  const idx = webQueueStore.findIndex((q) => q.id === id)
  if (idx >= 0) webQueueStore.splice(idx, 1)
}

export async function incrementRetries(id: string): Promise<void> {
  const row = webQueueStore.find((q) => q.id === id)
  if (row) row.retries += 1
}

export async function clearQueue(): Promise<void> {
  webQueueStore.length = 0
}

export async function getNextQueueItem(): Promise<QueueItem | null> {
  const row = webQueueStore[0]
  return row ? rowToItem(row) : null
}
