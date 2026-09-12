import type { QueueItem, QueueOperation } from '@rinse/core'
import { generateQueueId } from '@rinse/core'
import { openOrgOfflineDb } from './db'
import { getOrganizationId, requireOrganizationId } from '../org'

function db() {
  const orgId = getOrganizationId()
  if (!orgId) return null
  return openOrgOfflineDb(orgId)
}

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
  const database = db()
  if (!database) requireOrganizationId()

  const item: QueueItem = {
    id: generateQueueId(),
    operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  }
  database!.runSync(
    'INSERT INTO queue (id, operation, created_at, retries) VALUES (?, ?, ?, ?)',
    [item.id, JSON.stringify(item.operation), item.createdAt, item.retries]
  )
  return item
}

export async function getQueueItems(): Promise<QueueItem[]> {
  const database = db()
  if (!database) return []

  const rows = database.getAllSync<{
    id: string
    operation: string
    created_at: string
    retries: number
  }>('SELECT id, operation, created_at, retries FROM queue ORDER BY created_at ASC')
  return rows.map(rowToItem)
}

export async function getQueueCount(): Promise<number> {
  const database = db()
  if (!database) return 0

  const row = database.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM queue')
  return row?.count ?? 0
}

export async function removeQueueItem(id: string): Promise<void> {
  const database = db()
  if (!database) return

  database.runSync('DELETE FROM queue WHERE id = ?', [id])
}

export async function incrementRetries(id: string): Promise<void> {
  const database = db()
  if (!database) return

  database.runSync('UPDATE queue SET retries = retries + 1 WHERE id = ?', [id])
}

export async function clearQueue(): Promise<void> {
  const database = db()
  if (!database) return

  database.runSync('DELETE FROM queue')
}

export async function getNextQueueItem(): Promise<QueueItem | null> {
  const database = db()
  if (!database) return null

  const row = database.getFirstSync<{
    id: string
    operation: string
    created_at: string
    retries: number
  }>('SELECT id, operation, created_at, retries FROM queue ORDER BY created_at ASC LIMIT 1')
  return row ? rowToItem(row) : null
}
