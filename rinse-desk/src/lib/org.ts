import { ClientResponseError } from 'pocketbase'
import { getPocketBase } from './pocketbase'

export function getOrganizationId(): string | null {
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return null
  const user = pb.authStore.record as { organization_id?: unknown } | null
  const raw = user?.organization_id
  if (typeof raw === 'string' && raw.length > 0) return raw
  if (raw && typeof raw === 'object' && 'id' in raw) {
    const id = (raw as { id?: unknown }).id
    if (typeof id === 'string' && id.length > 0) return id
  }
  return null
}

export function requireOrganizationId(): string {
  const id = getOrganizationId()
  if (!id) {
    throw new Error('Your account is not linked to an organization. Sign in with an active operator account.')
  }
  return id
}

export function escapeFilter(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function orgFilter(field = 'organization_id'): string {
  return `${field} = "${escapeFilter(requireOrganizationId())}"`
}

export function formatPbError(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof ClientResponseError) {
    const detail =
      (typeof err.response?.message === 'string' && err.response.message) ||
      err.message ||
      ''
    if (detail.startsWith('Free includes 5 active jobs.')) return 'Free includes 5 active jobs. Complete or cancel a job, or open Settings → Account → Billing to upgrade to Pro.'
    if (err.status === 401 || err.status === 403) {
      return 'Session expired or not allowed. Sign out and sign back in.'
    }
    if (err.status === 404) {
      return 'A required collection was not found on the server.'
    }
    if (!detail || detail === 'Something went wrong while processing your request.') {
      return `${fallback} (HTTP ${err.status || 0})`
    }
    return detail
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
