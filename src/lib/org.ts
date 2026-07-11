import { getPocketBase } from './pocketbase'

export function getOrganizationId(): string | null {
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return null
  const user = pb.authStore.record as { organization_id?: string } | null
  const id = user?.organization_id
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function requireOrganizationId(): string {
  const id = getOrganizationId()
  if (!id) throw new Error('Your account is not linked to an organization. Sign in with an active operator account.')
  return id
}
