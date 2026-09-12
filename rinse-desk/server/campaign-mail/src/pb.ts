import PocketBase from 'pocketbase'
import type { MailEnv } from './env.js'

export function createPb(env: MailEnv): PocketBase {
  const pb = new PocketBase(env.pbUrl)
  pb.autoCancellation(false)
  return pb
}

export async function authAsAdmin(env: MailEnv): Promise<PocketBase> {
  const pb = createPb(env)
  // PocketBase ≥0.23 superusers collection; fall back to legacy admins API.
  try {
    await pb.collection('_superusers').authWithPassword(env.pbAdminEmail, env.pbAdminPassword)
  } catch {
    await pb.admins.authWithPassword(env.pbAdminEmail, env.pbAdminPassword)
  }
  return pb
}

export async function authAsUser(env: MailEnv, bearerToken: string): Promise<{
  pb: PocketBase
  organizationId: string
  userId: string
}> {
  const pb = createPb(env)
  pb.authStore.save(bearerToken, null)
  const auth = await pb.collection('users').authRefresh()
  const record = auth.record as { id: string; organization_id?: string }
  const organizationId = typeof record.organization_id === 'string' ? record.organization_id : ''
  if (!organizationId) throw new Error('User is not linked to an organization')
  return { pb, organizationId, userId: record.id }
}

export function parseAudienceIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* ignore */
    }
  }
  return []
}

export function escapeFilter(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
