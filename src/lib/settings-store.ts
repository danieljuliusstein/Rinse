import {
  businessLogoApiUrl,
  DEFAULT_BUSINESS_LOGO_PATH,
  hasCustomBusinessLogo,
  pocketBaseRecordHasLogo,
} from './business-logo'
import { getSecureItem, setSecureItem } from './secure-storage'
import { getPocketBase } from './pocketbase'
import { isOnline } from './network'
import { requireOrganizationId } from './org'
import { appOrigin, loadOrganizationSlug } from './org-slug'
import {
  normalizeDocumentLocale,
  type BusinessPolicies,
  type DocumentLocale,
  type PortalPermissions,
  type ReviewPrefs,
  type SopTemplate,
  type TaxPreset,
  type TechRosterEntry,
  type TipPrefs,
} from '@rinse/core'

import type { BookingSchedule } from './booking-schedule'
import { DEFAULT_BOOKING_SCHEDULE, normalizeBookingSchedule } from './booking-schedule'
import { normalizeEmailDeliverability } from './email-deliverability'
import {
  normalizeBusinessPolicies,
  normalizePortalPermissions,
  normalizeReviewPrefs,
  normalizeSopTemplates,
  normalizeTaxPresets,
  normalizeTechRoster,
  normalizeTipPrefs,
} from './wave5-prefs'

export type { BookingSchedule } from './booking-schedule'
export { DEFAULT_BOOKING_SCHEDULE, normalizeBookingSchedule } from './booking-schedule'

export type HomeModuleId =
  | 'cta_row'
  | 'ar_alert'
  | 'job_readiness'
  | 'invoice_month_carousel'
  | 'revenue_chart'
  | 'month_calendar'
  | 'today_jobs'
  | 'upcoming'
  | 'upcoming_jobs'
  | 'inventory_alert'

export interface HomeModulePrefs {
  cta_row?: boolean
  ar_alert?: boolean
  job_readiness?: boolean
  invoice_month_carousel?: boolean
  revenue_chart?: boolean
  inventory_alert?: boolean
  month_calendar?: boolean
  today_jobs?: boolean
  upcoming?: boolean
  upcoming_jobs?: boolean
}

const HOME_MODULE_DEFAULTS: Record<HomeModuleId, boolean> = {
  cta_row: true,
  ar_alert: true,
  job_readiness: true,
  invoice_month_carousel: false,
  revenue_chart: false,
  month_calendar: true,
  today_jobs: true,
  upcoming: true,
  upcoming_jobs: true,
  inventory_alert: true,
}

export const HOME_MODULE_TOGGLES: { id: HomeModuleId; label: string }[] = [
  { id: 'cta_row', label: 'Quick actions' },
  { id: 'ar_alert', label: 'Open invoices alert' },
  { id: 'job_readiness', label: 'Job readiness' },
  { id: 'invoice_month_carousel', label: 'Collected carousel' },
  { id: 'revenue_chart', label: 'Revenue chart' },
  { id: 'month_calendar', label: 'Month calendar' },
  { id: 'today_jobs', label: "Today's jobs" },
  { id: 'upcoming', label: 'Upcoming jobs' },
  { id: 'inventory_alert', label: 'Low inventory alert' },
]

export interface AppSettings {
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  invoice_terms_footer: string
  notifications: {
    job_reminder: boolean
    morning_reminder: boolean
    follow_up: boolean
    invoice_overdue: boolean
    low_inventory: boolean
  }
  last_backup_at?: string
  logo_url?: string
  accent_color?: string | null
  booking_schedule?: BookingSchedule
  travel_rate_per_mile?: number
  track_job_supplies?: boolean
  appearance?: 'light' | 'dark'
  invoice_template?: 'rinse' | 'classic' | 'minimal'
  /** App + customer-facing quote/invoice/portal language. */
  document_locale?: DocumentLocale
  home_modules?: HomeModulePrefs
  onboarding_step?: number
  onboarding_completed_at?: string
  onboarding_first_invoice_at?: string
  pb_record_id?: string
  /** IANA timezone for quiet hours + scheduling (Wave 3B). */
  timezone?: string
  quiet_hours_enabled?: boolean
  quiet_start_hour?: number
  quiet_end_hour?: number
  /** Operator checklist for custom sending domain (SPF/DKIM/DMARC). */
  email_deliverability?: import('./email-deliverability').EmailDeliverabilityChecklist
  business_policies?: BusinessPolicies
  tip_prefs?: TipPrefs
  portal_permissions?: PortalPermissions
  tax_presets?: TaxPreset[]
  sop_templates?: SopTemplate[]
  tech_roster?: TechRosterEntry[]
  review_prefs?: ReviewPrefs
}

export const DEFAULT_INVOICE_TERMS = 'Due on receipt. Thank you for your business.'

const DEFAULTS: AppSettings = {
  business_name: '',
  business_phone: '',
  business_email: '',
  business_address: '',
  invoice_terms_footer: DEFAULT_INVOICE_TERMS,
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
  appearance: 'light',
  invoice_template: 'rinse',
}

function settingsRecordKey(orgId: string) {
  return `rinse_settings_record_${orgId}`
}

function notificationsFromRecord(raw: unknown): AppSettings['notifications'] {
  const defaults = { ...DEFAULTS.notifications }
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

function logoUrlForRecord(record: Record<string, unknown>, slug: string | null): string {
  if (!pocketBaseRecordHasLogo(record.logo)) return DEFAULT_BUSINESS_LOGO_PATH
  if (!slug) return DEFAULT_BUSINESS_LOGO_PATH
  return `${appOrigin()}${businessLogoApiUrl(slug, record.updated)}`
}

function recordToSettings(record: Record<string, unknown>, logoUrl?: string): AppSettings {
  return {
    business_name: String(record.business_name ?? ''),
    business_phone: String(record.business_phone ?? ''),
    business_email: String(record.business_email ?? ''),
    business_address: String(record.business_address ?? ''),
    invoice_terms_footer: String(record.invoice_terms_footer ?? DEFAULT_INVOICE_TERMS),
    notifications: notificationsFromRecord(record.notifications),
    last_backup_at: record.last_backup_at ? String(record.last_backup_at) : undefined,
    logo_url: logoUrl ?? DEFAULT_BUSINESS_LOGO_PATH,
    accent_color: record.accent_color ? String(record.accent_color) : null,
    booking_schedule: record.booking_schedule
      ? normalizeBookingSchedule(record.booking_schedule)
      : undefined,
    travel_rate_per_mile:
      typeof record.travel_rate_per_mile === 'number' ? record.travel_rate_per_mile : undefined,
    track_job_supplies: record.track_job_supplies === true,
    invoice_template: (record.invoice_template as AppSettings['invoice_template']) ?? 'rinse',
    document_locale: normalizeDocumentLocale(record.document_locale),
    home_modules: (record.home_modules as HomeModulePrefs | undefined) ?? {},
    onboarding_step: typeof record.onboarding_step === 'number' ? record.onboarding_step : undefined,
    onboarding_completed_at: record.onboarding_completed_at
      ? String(record.onboarding_completed_at).slice(0, 10)
      : undefined,
    onboarding_first_invoice_at: record.onboarding_first_invoice_at
      ? String(record.onboarding_first_invoice_at).slice(0, 10)
      : undefined,
    pb_record_id: record.id ? String(record.id) : undefined,
    timezone: record.timezone ? String(record.timezone) : undefined,
    quiet_hours_enabled: record.quiet_hours_enabled !== false,
    quiet_start_hour:
      typeof record.quiet_start_hour === 'number'
        ? record.quiet_start_hour
        : typeof record.sms_quiet_start_hour === 'number'
          ? record.sms_quiet_start_hour
          : undefined,
    quiet_end_hour:
      typeof record.quiet_end_hour === 'number'
        ? record.quiet_end_hour
        : typeof record.sms_quiet_end_hour === 'number'
          ? record.sms_quiet_end_hour
          : undefined,
    email_deliverability: normalizeEmailDeliverability(record.email_deliverability),
    business_policies: record.business_policies
      ? normalizeBusinessPolicies(record.business_policies)
      : undefined,
    tip_prefs: record.tip_prefs ? normalizeTipPrefs(record.tip_prefs) : undefined,
    portal_permissions: record.portal_permissions
      ? normalizePortalPermissions(record.portal_permissions)
      : undefined,
    tax_presets: record.tax_presets ? normalizeTaxPresets(record.tax_presets) : undefined,
    sop_templates: record.sop_templates ? normalizeSopTemplates(record.sop_templates) : undefined,
    tech_roster: record.tech_roster ? normalizeTechRoster(record.tech_roster) : undefined,
    review_prefs: record.review_prefs ? normalizeReviewPrefs(record.review_prefs) : undefined,
  }
}

async function resolveAppSettingsRecordId(orgId: string): Promise<string | null> {
  const storedId = await getSecureItem(settingsRecordKey(orgId))
  const pb = getPocketBase()
  const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  if (storedId) {
    try {
      const row = await pb.collection('app_settings').getOne(storedId, { fields: 'id,organization_id' })
      if (String(row.organization_id ?? '') === orgId) return storedId
    } catch {
      // stale
    }
  }

  const existing = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${escaped}"`,
    limit: 1,
  })
  return existing[0]?.id ? String(existing[0].id) : null
}

export async function loadSettings(): Promise<AppSettings> {
  if (!(await isOnline())) return { ...DEFAULTS }
  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return { ...DEFAULTS }

  try {
    const escaped = orgId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const records = await pb.collection('app_settings').getFullList({
      filter: `organization_id = "${escaped}"`,
      limit: 1,
    })
    if (records.length === 0) return { ...DEFAULTS }
    const record = records[0] as Record<string, unknown>
    await setSecureItem(settingsRecordKey(orgId), String(record.id))
    const slug = await loadOrganizationSlug()
    return recordToSettings(record, logoUrlForRecord(record, slug))
  } catch {
    return { ...DEFAULTS }
  }
}

export type BusinessLogoUpload = {
  uri: string
  mimeType?: string | null
  fileName?: string | null
}

async function settingsFromRecord(record: Record<string, unknown>): Promise<AppSettings> {
  const slug = await loadOrganizationSlug()
  return recordToSettings(record, logoUrlForRecord(record, slug))
}

export async function uploadBusinessLogo(asset: BusinessLogoUpload): Promise<AppSettings> {
  if (!(await isOnline())) throw new Error('You are offline')

  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  if (!pb.authStore.isValid) throw new Error('Not signed in')

  const recordId = await resolveAppSettingsRecordId(orgId)
  const formData = new FormData()
  formData.append('logo', {
    uri: asset.uri,
    name: asset.fileName?.trim() || 'logo.jpg',
    type: asset.mimeType?.trim() || 'image/jpeg',
  } as unknown as Blob)

  let record: Record<string, unknown>
  if (recordId) {
    record = (await pb.collection('app_settings').update(recordId, formData)) as Record<string, unknown>
  } else {
    const current = await loadSettings()
    formData.append('organization_id', orgId)
    formData.append('business_name', current.business_name)
    formData.append('business_phone', current.business_phone)
    formData.append('business_email', current.business_email)
    formData.append('business_address', current.business_address)
    formData.append('invoice_terms_footer', current.invoice_terms_footer)
    formData.append('notifications', JSON.stringify(current.notifications))
    record = (await pb.collection('app_settings').create(formData)) as Record<string, unknown>
    await setSecureItem(settingsRecordKey(orgId), String(record.id))
  }

  try {
    record = (await pb.collection('app_settings').getOne(String(record.id))) as Record<string, unknown>
  } catch {
    // use update response
  }

  const saved = await settingsFromRecord(record)
  if (!hasCustomBusinessLogo(saved.logo_url)) {
    throw new Error('Logo was not saved')
  }
  return saved
}

export async function clearBusinessLogo(): Promise<AppSettings> {
  if (!(await isOnline())) throw new Error('You are offline')

  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  if (!pb.authStore.isValid) throw new Error('Not signed in')

  const current = await loadSettings()
  const recordId = await resolveAppSettingsRecordId(orgId)
  if (!recordId) return { ...current, logo_url: DEFAULT_BUSINESS_LOGO_PATH }

  const payload = {
    business_name: current.business_name,
    business_phone: current.business_phone,
    business_email: current.business_email,
    business_address: current.business_address,
    invoice_terms_footer: current.invoice_terms_footer,
    notifications: current.notifications,
    logo: null,
  }

  const record = (await pb.collection('app_settings').update(recordId, payload)) as Record<string, unknown>
  return settingsFromRecord(record)
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings()
  const next: AppSettings = {
    ...current,
    ...patch,
    notifications: { ...current.notifications, ...patch.notifications },
    home_modules: { ...current.home_modules, ...patch.home_modules },
  }

  if (!(await isOnline())) return next

  const orgId = requireOrganizationId()
  const pb = getPocketBase()
  if (!pb.authStore.isValid) return next

  const recordId = await resolveAppSettingsRecordId(orgId)
  const payload: Record<string, unknown> = {
    business_name: next.business_name,
    business_phone: next.business_phone,
    business_email: next.business_email,
    business_address: next.business_address,
    invoice_terms_footer: next.invoice_terms_footer,
    notifications: next.notifications,
  }
  if (next.accent_color !== undefined) payload.accent_color = next.accent_color?.trim() || ''
  if (next.booking_schedule !== undefined) {
    payload.booking_schedule = normalizeBookingSchedule(next.booking_schedule)
  }
  if (next.travel_rate_per_mile !== undefined) payload.travel_rate_per_mile = next.travel_rate_per_mile ?? 0
  if (next.track_job_supplies !== undefined) payload.track_job_supplies = next.track_job_supplies
  if (next.invoice_template !== undefined) payload.invoice_template = next.invoice_template ?? 'rinse'
  if (next.document_locale !== undefined) payload.document_locale = next.document_locale ?? 'en'
  if (next.home_modules !== undefined) payload.home_modules = next.home_modules
  if (next.last_backup_at !== undefined) payload.last_backup_at = next.last_backup_at
  if (next.onboarding_step !== undefined) payload.onboarding_step = next.onboarding_step
  if (next.onboarding_completed_at !== undefined) {
    payload.onboarding_completed_at = next.onboarding_completed_at || null
  }
  if (next.onboarding_first_invoice_at !== undefined) {
    payload.onboarding_first_invoice_at = next.onboarding_first_invoice_at || null
  }
  if (next.timezone !== undefined) payload.timezone = next.timezone?.trim() || ''
  if (next.quiet_hours_enabled !== undefined) payload.quiet_hours_enabled = next.quiet_hours_enabled
  if (next.quiet_start_hour !== undefined) {
    payload.quiet_start_hour = next.quiet_start_hour
    payload.sms_quiet_start_hour = next.quiet_start_hour
  }
  if (next.quiet_end_hour !== undefined) {
    payload.quiet_end_hour = next.quiet_end_hour
    payload.sms_quiet_end_hour = next.quiet_end_hour
  }
  if (next.email_deliverability !== undefined) {
    payload.email_deliverability = normalizeEmailDeliverability(next.email_deliverability)
  }
  if (next.business_policies !== undefined) {
    payload.business_policies = normalizeBusinessPolicies(next.business_policies)
  }
  if (next.tip_prefs !== undefined) {
    payload.tip_prefs = normalizeTipPrefs(next.tip_prefs)
  }
  if (next.portal_permissions !== undefined) {
    payload.portal_permissions = normalizePortalPermissions(next.portal_permissions)
  }
  if (next.tax_presets !== undefined) {
    payload.tax_presets = normalizeTaxPresets(next.tax_presets)
  }
  if (next.sop_templates !== undefined) {
    payload.sop_templates = normalizeSopTemplates(next.sop_templates)
  }
  if (next.tech_roster !== undefined) {
    payload.tech_roster = normalizeTechRoster(next.tech_roster)
  }
  if (next.review_prefs !== undefined) {
    payload.review_prefs = normalizeReviewPrefs(next.review_prefs)
  }

  let record: Record<string, unknown>
  if (recordId) {
    record = (await pb.collection('app_settings').update(recordId, payload)) as Record<string, unknown>
  } else {
    record = (await pb.collection('app_settings').create({
      ...payload,
      organization_id: orgId,
    })) as Record<string, unknown>
    await setSecureItem(settingsRecordKey(orgId), String(record.id))
  }

  const trimmedName = next.business_name.trim()
  if (trimmedName) {
    try {
      await pb.collection('organizations').update(orgId, { name: trimmedName })
    } catch {
      // non-fatal
    }
  }

  return settingsFromRecord(record)
}

export async function getBusinessName(): Promise<string> {
  const settings = await loadSettings()
  return settings.business_name.trim()
}

export function isHomeModuleEnabled(modules: HomeModulePrefs | undefined, key: HomeModuleId): boolean {
  const alias = key === 'upcoming_jobs' ? 'upcoming' : key === 'upcoming' ? 'upcoming_jobs' : null
  if (modules) {
    if (key in modules) return modules[key] !== false
    if (alias && alias in modules) return modules[alias as HomeModuleId] !== false
  }
  return HOME_MODULE_DEFAULTS[key] ?? true
}
