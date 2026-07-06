import { getAuthFetchHeaders } from './pb-auth'
import type { OrgSubscription, SubscriptionStatus } from './subscription'

export type AdminView = 'overview' | 'orgs' | 'backups' | 'system' | 'audit' | 'account'

export interface AdminOrg extends Omit<OrgSubscription, 'stripe_customer_id' | 'stripe_subscription_id'> {
  id: string
  name: string
  slug: string
  booking_enabled: boolean
  created: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export interface AdminOrgSummary {
  total: number
  active: number
  trialing: number
  past_due: number
  founding: number
}

export interface AdminOrgsResponse {
  orgs: AdminOrg[]
  summary: AdminOrgSummary
}

export interface BackupPreflightResponse {
  ok: boolean
  scope: string
  exported_at: string
  counts: Record<string, number>
}

export type AdminOrgPatch = Partial<{
  booking_enabled: boolean
  plan: 'founding' | 'starter' | 'pro'
  trial_ends_at: string
  subscription_status: SubscriptionStatus
}>

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...getAuthFetchHeaders(),
      ...(init?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
  }
  return data as T
}

export async function fetchAdminOrgs(): Promise<AdminOrgsResponse> {
  return adminFetch<AdminOrgsResponse>('/api/admin/orgs')
}

export async function fetchPlatformAdminAccess(): Promise<boolean> {
  try {
    const data = await adminFetch<{ admin: boolean }>('/api/admin/me')
    return data.admin === true
  } catch {
    return false
  }
}

export async function patchAdminOrg(id: string, body: AdminOrgPatch): Promise<AdminOrg> {
  const data = await adminFetch<{ org: Record<string, unknown> }>(`/api/admin/orgs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const org = data.org
  return {
    id: String(org.id ?? id),
    name: String(org.name ?? ''),
    slug: String(org.slug ?? ''),
    plan: String(org.plan ?? ''),
    founding_member: org.founding_member === true,
    subscription_status: String(org.subscription_status ?? 'none') as SubscriptionStatus,
    trial_ends_at: org.trial_ends_at ? String(org.trial_ends_at) : undefined,
    current_period_end: org.current_period_end ? String(org.current_period_end) : undefined,
    stripe_customer_id: org.stripe_customer_id ? String(org.stripe_customer_id) : null,
    stripe_subscription_id: org.stripe_subscription_id ? String(org.stripe_subscription_id) : null,
    booking_enabled: org.booking_enabled !== false,
    created: String(org.created ?? ''),
  }
}

export async function fetchBackupPreflight(): Promise<BackupPreflightResponse> {
  return adminFetch<BackupPreflightResponse>('/api/admin/backups/trigger')
}

export async function downloadFullBackup(): Promise<{ filename: string; blob: Blob }> {
  const res = await fetch('/api/admin/backups/trigger', {
    method: 'POST',
    headers: getAuthFetchHeaders(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(typeof data.error === 'string' ? data.error : 'Backup failed')
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `detailing-full-backup-${new Date().toISOString().slice(0, 10)}.json`
  return { filename, blob }
}
