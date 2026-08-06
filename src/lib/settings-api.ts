import { getPocketBase } from './pocketbase'
import { orgFilter, requireOrganizationId } from './org'
import {
  DEFAULT_BOOKING_SCHEDULE,
  normalizeBookingSchedule,
  type BookingSchedule,
} from './booking-schedule'
import { normalizeDocumentLocale, type DocumentLocale } from './document-locales'
import {
  clampHour,
  DEFAULT_QUIET_END_HOUR,
  DEFAULT_QUIET_START_HOUR,
  detectDeviceTimeZone,
  normalizeTimeZone,
} from './quiet-hours'

export type { BookingSchedule } from './booking-schedule'
export type { DocumentLocale } from './document-locales'

export type DeskAppSettings = {
  id?: string
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  invoice_terms_footer: string
  timezone: string
  quiet_hours_enabled: boolean
  quiet_start_hour: number
  quiet_end_hour: number
  document_locale: DocumentLocale
  travel_rate_per_mile: number
  track_job_supplies: boolean
  invoice_template: 'rinse' | 'classic' | 'minimal'
  booking_schedule: BookingSchedule
  notifications: {
    job_reminder: boolean
    morning_reminder: boolean
    follow_up: boolean
    invoice_overdue: boolean
    low_inventory: boolean
  }
}

const DEFAULT_TERMS = 'Due on receipt. Thank you for your business.'

export const DEFAULT_SETTINGS: DeskAppSettings = {
  business_name: '',
  business_phone: '',
  business_email: '',
  business_address: '',
  invoice_terms_footer: DEFAULT_TERMS,
  timezone: detectDeviceTimeZone(),
  quiet_hours_enabled: true,
  quiet_start_hour: DEFAULT_QUIET_START_HOUR,
  quiet_end_hour: DEFAULT_QUIET_END_HOUR,
  document_locale: 'en',
  travel_rate_per_mile: 0,
  track_job_supplies: false,
  invoice_template: 'rinse',
  booking_schedule: { ...DEFAULT_BOOKING_SCHEDULE, open_dates: [] },
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
}

function fromRecord(record: Record<string, unknown>): DeskAppSettings {
  const notes =
    (record.notifications as DeskAppSettings['notifications'] | undefined) ??
    DEFAULT_SETTINGS.notifications
  return {
    id: String(record.id),
    business_name: String(record.business_name ?? ''),
    business_phone: String(record.business_phone ?? ''),
    business_email: String(record.business_email ?? ''),
    business_address: String(record.business_address ?? ''),
    invoice_terms_footer: String(record.invoice_terms_footer ?? DEFAULT_TERMS),
    timezone: normalizeTimeZone(record.timezone || detectDeviceTimeZone()),
    quiet_hours_enabled: record.quiet_hours_enabled !== false,
    quiet_start_hour: clampHour(
      typeof record.quiet_start_hour === 'number'
        ? record.quiet_start_hour
        : typeof record.sms_quiet_start_hour === 'number'
          ? record.sms_quiet_start_hour
          : DEFAULT_QUIET_START_HOUR,
      DEFAULT_QUIET_START_HOUR,
    ),
    quiet_end_hour: clampHour(
      typeof record.quiet_end_hour === 'number'
        ? record.quiet_end_hour
        : typeof record.sms_quiet_end_hour === 'number'
          ? record.sms_quiet_end_hour
          : DEFAULT_QUIET_END_HOUR,
      DEFAULT_QUIET_END_HOUR,
    ),
    document_locale: normalizeDocumentLocale(record.document_locale),
    travel_rate_per_mile: Number(record.travel_rate_per_mile ?? 0) || 0,
    track_job_supplies: record.track_job_supplies === true,
    invoice_template:
      record.invoice_template === 'classic' || record.invoice_template === 'minimal'
        ? record.invoice_template
        : 'rinse',
    booking_schedule: normalizeBookingSchedule(record.booking_schedule),
    notifications: {
      job_reminder: notes.job_reminder !== false,
      morning_reminder: notes.morning_reminder !== false,
      follow_up: notes.follow_up !== false,
      invoice_overdue: notes.invoice_overdue !== false,
      low_inventory: notes.low_inventory !== false,
    },
  }
}

export async function loadAppSettings(): Promise<DeskAppSettings> {
  const pb = getPocketBase()
  const empty = (): DeskAppSettings => ({
    ...DEFAULT_SETTINGS,
    timezone: detectDeviceTimeZone(),
    booking_schedule: { ...DEFAULT_BOOKING_SCHEDULE, open_dates: [] },
    notifications: { ...DEFAULT_SETTINGS.notifications },
  })
  try {
    let rows
    try {
      // Prefer -id: Fly app_settings may lack `updated` autodate (-updated → HTTP 400).
      rows = await pb.collection('app_settings').getFullList({
        filter: orgFilter(),
        sort: '-id',
      })
    } catch {
      rows = await pb.collection('app_settings').getFullList({
        filter: orgFilter(),
      })
    }
    if (!rows[0]) return empty()
    return fromRecord(rows[0] as unknown as Record<string, unknown>)
  } catch {
    return empty()
  }
}

export async function saveAppSettings(next: DeskAppSettings): Promise<DeskAppSettings> {
  const pb = getPocketBase()
  const orgId = requireOrganizationId()
  const name = next.business_name.trim()
  if (!name) {
    throw new Error('Business name is required')
  }
  const schedule = normalizeBookingSchedule(next.booking_schedule)
  const quietStart = clampHour(next.quiet_start_hour, DEFAULT_QUIET_START_HOUR)
  const quietEnd = clampHour(next.quiet_end_hour, DEFAULT_QUIET_END_HOUR)
  const locale = normalizeDocumentLocale(next.document_locale)
  const timezone = normalizeTimeZone(next.timezone.trim() || detectDeviceTimeZone())
  const travelRate = Number(next.travel_rate_per_mile)
  const payload: Record<string, unknown> = {
    business_name: name,
    business_phone: next.business_phone.trim(),
    business_email: next.business_email.trim(),
    business_address: next.business_address.trim(),
    invoice_terms_footer: next.invoice_terms_footer.trim() || DEFAULT_TERMS,
    notifications: next.notifications,
    timezone,
    quiet_hours_enabled: next.quiet_hours_enabled,
    quiet_start_hour: quietStart,
    quiet_end_hour: quietEnd,
    sms_quiet_start_hour: quietStart,
    sms_quiet_end_hour: quietEnd,
    document_locale: locale,
    travel_rate_per_mile: Number.isFinite(travelRate) && travelRate > 0 ? travelRate : 0,
    track_job_supplies: next.track_job_supplies,
    invoice_template: next.invoice_template,
    booking_schedule: schedule,
  }

  let record: Record<string, unknown>
  if (next.id) {
    record = (await pb.collection('app_settings').update(next.id, payload)) as unknown as Record<
      string,
      unknown
    >
  } else {
    record = (await pb.collection('app_settings').create({
      ...payload,
      organization_id: orgId,
    })) as unknown as Record<string, unknown>
  }

  try {
    await pb.collection('organizations').update(orgId, { name })
  } catch {
    // non-fatal
  }

  return fromRecord(record)
}
