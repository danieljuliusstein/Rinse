import { escapeFilterValue } from './mappers'
import { requireOrganizationId } from '../tenant'

export function tenantFilter(extra?: string): string {
  const orgId = escapeFilterValue(requireOrganizationId())
  const base = `organization_id = "${orgId}"`
  if (!extra?.trim()) return base
  return `${base} && (${extra})`
}

export function withOrganization<T extends Record<string, unknown>>(
  payload: T,
): T & { organization_id: string } {
  return { ...payload, organization_id: requireOrganizationId() }
}

export function settingsRecordIdKey(orgId: string): string {
  return `detailing_app_settings_id_${orgId}`
}
