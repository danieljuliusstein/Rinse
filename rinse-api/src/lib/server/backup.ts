import type PocketBase from 'pocketbase'
import { logAuditEvent } from './audit-log'
import { authenticateServerPocketBase } from './pocketbase-admin'

const COLLECTIONS = [
  'packages',
  'clients',
  'jobs',
  'invoices',
  'supplies',
  'overhead_expenses',
  'app_settings',
  'notifications_log',
  'vehicles',
  'damage_docs',
  'quotes',
  'business_expenses',
  'equipment',
] as const

export interface BackupPayload {
  exported_at: string
  version: 1
  organization_id?: string
  collections: Record<string, unknown[]>
}

export async function createPocketBaseBackup(
  organizationId?: string,
  existingPb?: PocketBase,
): Promise<BackupPayload> {
  const pb = existingPb ?? (await authenticateServerPocketBase())
  const collections: Record<string, unknown[]> = {}
  const orgFilter = organizationId ? `organization_id = "${organizationId}"` : undefined

  for (const name of COLLECTIONS) {
    try {
      collections[name] = await pb.collection(name).getFullList({
        sort: '-id',
        ...(orgFilter ? { filter: orgFilter } : {}),
      })
    } catch {
      collections[name] = []
    }
  }

  const payload: BackupPayload = {
    exported_at: new Date().toISOString(),
    version: 1,
    organization_id: organizationId,
    collections,
  }

  if (organizationId) {
    await updateLastBackupAt(pb, organizationId)
  }

  return payload
}

async function updateLastBackupAt(pb: PocketBase, organizationId: string) {
  try {
    const records = await pb.collection('app_settings').getFullList({
      filter: `organization_id = "${organizationId}"`,
      limit: 1,
    })
    const now = new Date().toISOString().slice(0, 10)
    if (records.length > 0) {
      await pb.collection('app_settings').update(records[0].id, { last_backup_at: now })
    }
  } catch {
    // app_settings may not exist yet
  }
}

export function logAdminBackupTrigger(input: {
  authPath: 'platform_admin_jwt' | 'internal_api_secret'
  actor: string
  scope: 'all'
}) {
  logAuditEvent('admin_backup_triggered', input)
}
