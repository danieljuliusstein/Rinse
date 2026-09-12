import { webDraftStore } from './memory-store.web'
import type { DraftEntity, DraftRecord } from './drafts.native'

export type { DraftEntity, DraftRecord }

function key(entity: DraftEntity, entityId: string): string {
  return `${entity}::${entityId}`
}

export async function saveDraft<T>(entity: DraftEntity, entityId: string, payload: T): Promise<void> {
  webDraftStore.set(key(entity, entityId), {
    entity,
    entity_id: entityId,
    payload: JSON.stringify(payload),
    updated_at: new Date().toISOString(),
  })
}

export async function loadDraft<T>(entity: DraftEntity, entityId: string): Promise<DraftRecord<T> | null> {
  const row = webDraftStore.get(key(entity, entityId))
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
  webDraftStore.delete(key(entity, entityId))
}

export async function listDrafts(entity?: DraftEntity): Promise<DraftRecord[]> {
  const rows = [...webDraftStore.values()]
    .filter((row) => (entity ? row.entity === entity : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))

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
