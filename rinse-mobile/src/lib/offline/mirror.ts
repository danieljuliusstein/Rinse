import { openOrgOfflineDb } from './db'
import { requireOrganizationId } from '../org'

export interface MirrorRecord {
  collection: string
  id: string
  organization_id: string
  updated?: string
  json_data: string
}

function orgDb() {
  return openOrgOfflineDb(requireOrganizationId())
}

export function upsertMirrorRecord(
  collection: string,
  id: string,
  organizationId: string,
  data: Record<string, unknown>
): void {
  const database = openOrgOfflineDb(organizationId)
  const fromPayload = data.updated ? String(data.updated) : null
  const existing = database.getFirstSync<{ updated: string | null }>(
    'SELECT updated FROM records WHERE collection = ? AND id = ? AND organization_id = ?',
    [collection, id, organizationId]
  )
  // Prefer server autodate; keep mirror stamp on local-only writes; never fake "now" on refetch.
  const updated = fromPayload ?? existing?.updated ?? new Date().toISOString()
  database.runSync(
    `INSERT INTO records (collection, id, organization_id, updated, json_data)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(collection, id) DO UPDATE SET
       organization_id = excluded.organization_id,
       updated = excluded.updated,
       json_data = excluded.json_data`,
    [collection, id, organizationId, updated, JSON.stringify(data)]
  )
}

export function getMirrorRecord<T extends Record<string, unknown>>(
  collection: string,
  id: string
): T | null {
  const database = orgDb()
  const orgId = requireOrganizationId()
  const row = database.getFirstSync<MirrorRecord>(
    'SELECT json_data FROM records WHERE collection = ? AND id = ? AND organization_id = ?',
    [collection, id, orgId]
  )
  if (!row?.json_data) return null
  return JSON.parse(row.json_data) as T
}

export function getMirrorUpdated(collection: string, id: string): string | null {
  const database = orgDb()
  const orgId = requireOrganizationId()
  const row = database.getFirstSync<{ updated: string | null }>(
    'SELECT updated FROM records WHERE collection = ? AND id = ? AND organization_id = ?',
    [collection, id, orgId]
  )
  return row?.updated ?? null
}

export function listMirrorRecords<T extends Record<string, unknown>>(
  collection: string,
  limit = 200
): T[] {
  const database = orgDb()
  const orgId = requireOrganizationId()
  const rows = database.getAllSync<MirrorRecord>(
    `SELECT json_data FROM records
     WHERE collection = ? AND organization_id = ?
     ORDER BY updated DESC
     LIMIT ?`,
    [collection, orgId, limit]
  )
  return rows.map((row) => JSON.parse(row.json_data) as T)
}

export function deleteMirrorRecord(collection: string, id: string): void {
  const database = orgDb()
  const orgId = requireOrganizationId()
  database.runSync(
    'DELETE FROM records WHERE collection = ? AND id = ? AND organization_id = ?',
    [collection, id, orgId]
  )
}

export function clearMirror(): void {
  const database = orgDb()
  database.runSync('DELETE FROM records')
}
