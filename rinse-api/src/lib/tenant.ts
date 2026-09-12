import { getPocketBase } from './pocketbase'
import { ensurePocketBaseAuth } from './pb-auth'

export function getCurrentOrganizationId(): string | null {
  const pb = getPocketBase()
  if (!pb?.authStore.isValid) return null
  const record = pb.authStore.record as { organization_id?: string } | null
  return record?.organization_id ?? null
}

export function requireOrganizationId(): string {
  const orgId = getCurrentOrganizationId()
  if (!orgId) {
    throw new Error('No organization in session — log in again')
  }
  return orgId
}

/** Namespace browser storage per organization (falls back to legacy key when logged out). */
export function scopedStorageKey(base: string): string {
  const orgId = getCurrentOrganizationId()
  return orgId ? `${base}_${orgId}` : base
}

export function scopedDbName(base: string): string {
  const orgId = getCurrentOrganizationId()
  return orgId ? `${base}_${orgId}` : base
}

/** URL-safe slug from business name */
export function slugifyBusinessName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'detailing'
}

/** Load the current user's organization booking slug (null if unavailable). */
export async function loadOrganizationSlug(): Promise<string | null> {
  if (!(await ensurePocketBaseAuth())) return null
  const orgId = getCurrentOrganizationId()
  const pb = getPocketBase()
  if (!orgId || !pb?.authStore.isValid) return null
  try {
    const org = await pb.collection('organizations').getOne(orgId)
    const slug = String(org.slug ?? '').trim()
    return slug || null
  } catch {
    return null
  }
}
