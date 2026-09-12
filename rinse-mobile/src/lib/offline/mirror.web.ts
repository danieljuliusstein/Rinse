import { webMirrorStore } from './memory-store.web'
import { requireOrganizationId } from '../org'

export interface MirrorRecord {
  collection: string
  id: string
  organization_id: string
  updated?: string
  json_data: string
}

function mirrorKey(collection: string, id: string): string {
  return `${collection}:${id}`
}

export function upsertMirrorRecord(
  collection: string,
  id: string,
  organizationId: string,
  data: Record<string, unknown>
): void {
  const updated = data.updated ? String(data.updated) : new Date().toISOString()
  webMirrorStore.set(
    mirrorKey(collection, id),
    JSON.stringify({ collection, id, organization_id: organizationId, updated, json_data: JSON.stringify(data) })
  )
}

export function getMirrorRecord<T extends Record<string, unknown>>(
  collection: string,
  id: string
): T | null {
  const orgId = requireOrganizationId()
  const raw = webMirrorStore.get(mirrorKey(collection, id))
  if (!raw) return null
  const row = JSON.parse(raw) as MirrorRecord
  if (row.organization_id !== orgId) return null
  return JSON.parse(row.json_data) as T
}

export function listMirrorRecords<T extends Record<string, unknown>>(
  collection: string,
  limit = 200
): T[] {
  const orgId = requireOrganizationId()
  const items: T[] = []
  for (const raw of webMirrorStore.values()) {
    const row = JSON.parse(raw) as MirrorRecord
    if (row.collection !== collection || row.organization_id !== orgId) continue
    items.push(JSON.parse(row.json_data) as T)
    if (items.length >= limit) break
  }
  return items
}

export function getMirrorUpdated(collection: string, id: string): string | null {
  const orgId = requireOrganizationId()
  const raw = webMirrorStore.get(mirrorKey(collection, id))
  if (!raw) return null
  const row = JSON.parse(raw) as MirrorRecord
  if (row.organization_id !== orgId) return null
  return row.updated ?? null
}

export function deleteMirrorRecord(collection: string, id: string): void {
  webMirrorStore.delete(mirrorKey(collection, id))
}

export function clearMirror(): void {
  webMirrorStore.clear()
}
