import { openOrgOfflineDb } from './db'
import { getOrganizationId, requireOrganizationId } from '../org'

export type DraftEntity = 'quote' | 'invoice' | 'inspection' | (string & {})

export interface DraftRecord<T = unknown> {
  entity: DraftEntity
  entityId: string
  payload: T
  updatedAt: string
}

function db() {
  const orgId = getOrganizationId()
  if (!orgId) return null
  return openOrgOfflineDb(orgId)
}

export async function saveDraft<T>(entity: DraftEntity, entityId: string, payload: T): Promise<void> {
  const database = db()
  if (!database) requireOrganizationId()

  const updatedAt = new Date().toISOString()
  database!.runSync(
    `INSERT INTO drafts (entity, entity_id, payload, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entity, entity_id) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    [entity, entityId, JSON.stringify(payload), updatedAt]
  )
}

export async function loadDraft<T>(entity: DraftEntity, entityId: string): Promise<DraftRecord<T> | null> {
  const database = db()
  if (!database) return null

  const row = database.getFirstSync<{
    entity: string
    entity_id: string
    payload: string
    updated_at: string
  }>('SELECT entity, entity_id, payload, updated_at FROM drafts WHERE entity = ? AND entity_id = ?', [
    entity,
    entityId,
  ])
  if (!row) return null

  try {
    return {
      entity: row.entity,
      entityId: row.entity_id,
      payload: JSON.parse(row.payload) as T,
      updatedAt: row.updated_at,
    }
  } catch {
    return null
  }
}

export async function clearDraft(entity: DraftEntity, entityId: string): Promise<void> {
  const database = db()
  if (!database) return
  database.runSync('DELETE FROM drafts WHERE entity = ? AND entity_id = ?', [entity, entityId])
}

export async function listDrafts(entity?: DraftEntity): Promise<DraftRecord[]> {
  const database = db()
  if (!database) return []

  const rows = entity
    ? database.getAllSync<{
        entity: string
        entity_id: string
        payload: string
        updated_at: string
      }>('SELECT entity, entity_id, payload, updated_at FROM drafts WHERE entity = ? ORDER BY updated_at DESC', [
        entity,
      ])
    : database.getAllSync<{
        entity: string
        entity_id: string
        payload: string
        updated_at: string
      }>('SELECT entity, entity_id, payload, updated_at FROM drafts ORDER BY updated_at DESC')

  return rows.flatMap((row) => {
    try {
      return [
        {
          entity: row.entity,
          entityId: row.entity_id,
          payload: JSON.parse(row.payload) as unknown,
          updatedAt: row.updated_at,
        },
      ]
    } catch {
      return []
    }
  })
}
