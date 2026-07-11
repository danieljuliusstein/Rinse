import * as SQLite from 'expo-sqlite'

const AUTH_DB_NAME = 'rinse_offline_auth'
const OFFLINE_DB_PREFIX = 'rinse_offline_v1'

let authDb: SQLite.SQLiteDatabase | null = null
let orgDb: SQLite.SQLiteDatabase | null = null
let orgDbFor: string | null = null

function ensureAuthSchema(database: SQLite.SQLiteDatabase): void {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS auth_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      record_json TEXT NOT NULL
    );
  `)
}

function ensureOrgSchema(database: SQLite.SQLiteDatabase): void {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY NOT NULL,
      operation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_queue_created_at ON queue(created_at);

    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      updated TEXT,
      json_data TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS idx_records_org ON records(organization_id, collection);
  `)
}

export function getAuthDb(): SQLite.SQLiteDatabase {
  if (!authDb) {
    authDb = SQLite.openDatabaseSync(AUTH_DB_NAME)
    ensureAuthSchema(authDb)
  }
  return authDb
}

export function openOrgOfflineDb(orgId: string): SQLite.SQLiteDatabase {
  if (orgDb && orgDbFor === orgId) return orgDb
  if (orgDb) {
    orgDb.closeSync()
    orgDb = null
    orgDbFor = null
  }
  orgDb = SQLite.openDatabaseSync(`${OFFLINE_DB_PREFIX}_${orgId}`)
  ensureOrgSchema(orgDb)
  orgDbFor = orgId
  return orgDb
}

/** @deprecated Use openOrgOfflineDb(orgId) — kept for web stub parity */
export function getOfflineDb(): SQLite.SQLiteDatabase {
  return getAuthDb()
}

export function scopedQueueDbName(orgId: string | undefined): string {
  return orgId ? `${OFFLINE_DB_PREFIX}_${orgId}` : OFFLINE_DB_PREFIX
}

export function loadAuthProfile(): string | null {
  const database = getAuthDb()
  const row = database.getFirstSync<{ record_json: string }>(
    'SELECT record_json FROM auth_profile WHERE id = 1'
  )
  return row?.record_json ?? null
}

export function saveAuthProfile(recordJson: string): void {
  const database = getAuthDb()
  database.runSync(
    'INSERT INTO auth_profile (id, record_json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET record_json = excluded.record_json',
    [recordJson]
  )
}

export function clearAuthProfile(): void {
  const database = getAuthDb()
  database.runSync('DELETE FROM auth_profile')
}

export function resetOfflineDb(orgId?: string): void {
  clearAuthProfile()

  const targetOrgId = orgId ?? orgDbFor
  if (targetOrgId) {
    const database = openOrgOfflineDb(targetOrgId)
    database.execSync('DELETE FROM queue; DELETE FROM records;')
  }

  if (orgDb) {
    orgDb.closeSync()
    orgDb = null
    orgDbFor = null
  }

  if (authDb) {
    authDb.closeSync()
    authDb = null
  }
}
