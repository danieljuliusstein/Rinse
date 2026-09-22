import { normalizeDocumentLocale } from '@rinse/core'
import { businessLogoApiUrl, DEFAULT_BUSINESS_LOGO_PATH, pocketBaseRecordHasLogo } from '../business-logo'
import { getPocketBase, isPocketBaseConfigured } from '../pocketbase'
import { checkPocketBaseHealth } from '../pocketbase'
import { isPocketBaseAuthenticated } from '../pb-auth'
import { requireOrganizationId } from '../tenant'
import { normalizeBookingSchedule } from '../booking-availability'
import type { AppSettings } from '../settings'
import type { PbRecord } from './mappers'
import { tenantFilter, withOrganization, settingsRecordIdKey } from './tenant-pocketbase'

function pb() {
  const client = getPocketBase()
  if (!client?.authStore.isValid) throw new Error('PocketBase not authenticated')
  return client
}

function notificationsFromRecord(raw: unknown): AppSettings['notifications'] {
  const defaults: AppSettings['notifications'] = {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  }
  if (typeof raw !== 'object' || raw === null) return defaults
  const n = raw as Record<string, unknown>
  return {
    job_reminder: n.job_reminder !== false,
    morning_reminder: n.morning_reminder !== false,
    follow_up: n.follow_up !== false,
    invoice_overdue: n.invoice_overdue !== false,
    low_inventory: n.low_inventory !== false,
  }
}

function recordToSettings(
  record: PbRecord,
  logoUrl?: string,
  fallback?: Partial<AppSettings>,
): AppSettings {
  const notifications = notificationsFromRecord(record.notifications)
  const bookingSchedule = record.booking_schedule
    ? normalizeBookingSchedule(record.booking_schedule)
    : fallback?.booking_schedule
      ? normalizeBookingSchedule(fallback.booking_schedule)
      : undefined
  return {
    business_name: String(record.business_name ?? ''),
    business_phone: String(record.business_phone ?? ''),
    business_email: String(record.business_email ?? ''),
    business_address: String(record.business_address ?? ''),
    invoice_terms_footer: String(record.invoice_terms_footer ?? ''),
    document_locale: normalizeDocumentLocale(record.document_locale ?? fallback?.document_locale),
    notifications,
    last_backup_at: record.last_backup_at ? String(record.last_backup_at) : undefined,
    logo_url: logoUrl,
    accent_color: record.accent_color ? String(record.accent_color) : null,
    booking_schedule: bookingSchedule,
    travel_rate_per_mile:
      typeof record.travel_rate_per_mile === 'number' && record.travel_rate_per_mile > 0
        ? record.travel_rate_per_mile
        : undefined,
    track_job_supplies: record.track_job_supplies === true,
    invoice_template: record.invoice_template
      ? (String(record.invoice_template) as AppSettings['invoice_template'])
      : fallback?.invoice_template,
    onboarding_step:
      typeof record.onboarding_step === 'number' ? record.onboarding_step : fallback?.onboarding_step,
    onboarding_completed_at: record.onboarding_completed_at
      ? String(record.onboarding_completed_at).slice(0, 10)
      : fallback?.onboarding_completed_at,
    onboarding_first_invoice_at: record.onboarding_first_invoice_at
      ? String(record.onboarding_first_invoice_at).slice(0, 10)
      : fallback?.onboarding_first_invoice_at,
    pb_record_id: record.id,
  }
}

export async function canSyncSettings(): Promise<boolean> {
  if (!isPocketBaseConfigured()) return false
  if (!isPocketBaseAuthenticated()) return false
  if (!(await checkPocketBaseHealth())) return false
  return true
}

export async function loadSettingsFromPocketBase(): Promise<AppSettings | null> {
  if (!(await canSyncSettings())) return null

  try {
    const orgId = requireOrganizationId()
    const records = await pb().collection('app_settings').getFullList<PbRecord>({
      filter: tenantFilter(),
      limit: 1,
    })
    if (records.length === 0) return null

    const record = records[0]
    if (typeof window !== 'undefined') {
      localStorage.setItem(settingsRecordIdKey(orgId), record.id)
    }

    const slug = await resolveOrgSlug(orgId)
    const logoUrl = logoUrlForRecord(record, slug)

    return recordToSettings(record, logoUrl)
  } catch {
    return null
  }
}

async function resolveOrgSlug(orgId: string): Promise<string> {
  try {
    const org = await pb().collection('organizations').getOne(orgId)
    return String(org.slug ?? '')
  } catch {
    return ''
  }
}

function logoUrlForRecord(record: PbRecord, slug: string): string {
  if (!pocketBaseRecordHasLogo(record.logo)) return DEFAULT_BUSINESS_LOGO_PATH
  return businessLogoApiUrl(slug, record.updated)
}

/** Resolve the tenant's app_settings row — localStorage id can be stale after migrations. */
async function resolveAppSettingsRecordId(orgId: string): Promise<string | null> {
  const storedId =
    typeof window !== 'undefined' ? localStorage.getItem(settingsRecordIdKey(orgId)) : null

  if (storedId) {
    try {
      const row = await pb().collection('app_settings').getOne<PbRecord>(storedId, {
        fields: 'id,organization_id',
      })
      if (String(row.organization_id ?? '') === orgId) return storedId
    } catch {
      // stale or inaccessible — fall through to tenant query
    }
  }

  const existing = await pb().collection('app_settings').getFullList<PbRecord>({
    filter: tenantFilter(),
    limit: 1,
  })
  return existing[0]?.id ?? null
}

export async function saveSettingsToPocketBase(
  settings: AppSettings,
  logoFile?: File | null,
  options?: { clearLogo?: boolean }
): Promise<AppSettings> {
  if (!(await canSyncSettings())) throw new Error('PocketBase not available')

  const orgId = requireOrganizationId()
  const recordId = await resolveAppSettingsRecordId(orgId)
  const notifications = { ...settings.notifications }

  const payload: Record<string, unknown> = {
    business_name: settings.business_name,
    business_phone: settings.business_phone,
    business_email: settings.business_email,
    business_address: settings.business_address,
    invoice_terms_footer: settings.invoice_terms_footer,
    notifications,
  }
  if (settings.document_locale !== undefined) {
    payload.document_locale = normalizeDocumentLocale(settings.document_locale)
  }
  if (settings.accent_color !== undefined) {
    payload.accent_color = settings.accent_color?.trim() || ''
  }
  if (settings.booking_schedule !== undefined) {
    payload.booking_schedule = normalizeBookingSchedule(settings.booking_schedule)
  }
  if (settings.travel_rate_per_mile !== undefined) {
    payload.travel_rate_per_mile = settings.travel_rate_per_mile ?? 0
  }
  if (settings.track_job_supplies !== undefined) {
    payload.track_job_supplies = settings.track_job_supplies
  }
  if (settings.invoice_template !== undefined) {
    payload.invoice_template = settings.invoice_template ?? 'rinse'
  }
  if (settings.onboarding_step !== undefined) {
    payload.onboarding_step = settings.onboarding_step
  }
  if (settings.onboarding_completed_at !== undefined) {
    payload.onboarding_completed_at = settings.onboarding_completed_at || null
  }
  if (settings.onboarding_first_invoice_at !== undefined) {
    payload.onboarding_first_invoice_at = settings.onboarding_first_invoice_at || null
  }
  if (settings.last_backup_at) {
    payload.last_backup_at = settings.last_backup_at.slice(0, 10)
  }

  let record: PbRecord

  if (logoFile && recordId) {
    const formData = new FormData()
    formData.append('logo', logoFile)
    record = await pb().collection('app_settings').update<PbRecord>(recordId, formData)
  } else if (logoFile) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'notifications' || key === 'booking_schedule') {
        formData.append(key, JSON.stringify(value))
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false')
      } else {
        formData.append(key, String(value ?? ''))
      }
    }
    formData.append('logo', logoFile)

    if (recordId) {
      record = await pb().collection('app_settings').update<PbRecord>(recordId, formData)
    } else {
      formData.append('organization_id', orgId)
      record = await pb().collection('app_settings').create<PbRecord>(formData)
    }
  } else if (options?.clearLogo) {
    const clearPayload = { ...payload, logo: null }
    if (recordId) {
      record = await pb().collection('app_settings').update<PbRecord>(recordId, clearPayload)
    } else {
      record = await pb().collection('app_settings').create<PbRecord>(withOrganization(clearPayload))
    }
  } else if (recordId) {
    record = await pb().collection('app_settings').update<PbRecord>(recordId, payload)
  } else {
    record = await pb().collection('app_settings').create<PbRecord>(withOrganization(payload))
  }

  // Ensure JSON fields are fully populated on the returned record.
  try {
    record = await pb().collection('app_settings').getOne<PbRecord>(record.id)
  } catch {
    // use update/create response
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(settingsRecordIdKey(orgId), record.id)
  }

  const slug = await resolveOrgSlug(orgId)
  const logoUrl = logoUrlForRecord(record, slug)

  const trimmedName = settings.business_name.trim()
  if (trimmedName) {
    try {
      await pb().collection('organizations').update(orgId, { name: trimmedName })
    } catch (err) {
      console.warn('[settings] organization name sync failed:', err)
    }
  }

  return recordToSettings(record, logoUrl, settings)
}
