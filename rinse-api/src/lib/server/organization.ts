import { hasStarterAccess } from '../subscription'
import { authenticateServerAdmin } from './pocketbase-admin'
import { escapeFilterValue } from '../api/mappers'
import type { PbRecord } from '../api/mappers'

export interface OrganizationRecord {
  id: string
  name: string
  slug: string
  plan?: string
  founding_member?: boolean
  booking_enabled?: boolean
  allowed_origins?: string[]
}

export function parseAllowedOrigins(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationRecord | null> {
  const pb = await authenticateServerAdmin()
  const normalized = slug.trim().toLowerCase()
  const escaped = escapeFilterValue(normalized)
  try {
    const records = await pb.collection('organizations').getFullList<PbRecord>({
      filter: `slug = "${escaped}"`,
      limit: 1,
    })
    if (!records.length) return null
    const r = records[0]
    if (r.booking_enabled === false || !hasStarterAccess({ plan: String(r.plan), founding_member: r.founding_member === true, subscription_status: String(r.subscription_status), current_period_end: String(r.current_period_end || '') })) return null
    return {
      id: String(r.id),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      plan: r.plan ? String(r.plan) : undefined,
      founding_member: Boolean(r.founding_member),
      booking_enabled: r.booking_enabled !== false,
      allowed_origins: parseAllowedOrigins(r.allowed_origins),
    }
  } catch {
    return null
  }
}

export async function getOrganizationById(id: string): Promise<OrganizationRecord | null> {
  const pb = await authenticateServerAdmin()
  try {
    const r = await pb.collection('organizations').getOne<PbRecord>(id)
    return {
      id: String(r.id),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      plan: r.plan ? String(r.plan) : undefined,
      founding_member: Boolean(r.founding_member),
      booking_enabled: r.booking_enabled !== false,
      allowed_origins: parseAllowedOrigins(r.allowed_origins),
    }
  } catch {
    return null
  }
}
