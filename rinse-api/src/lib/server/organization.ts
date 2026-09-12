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
    if (r.booking_enabled === false) return null
    return {
      id: String(r.id),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      plan: r.plan ? String(r.plan) : undefined,
      founding_member: Boolean(r.founding_member),
      booking_enabled: r.booking_enabled !== false,
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
    }
  } catch {
    return null
  }
}
