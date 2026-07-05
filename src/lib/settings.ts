import { normalizeBookingSchedule, type BookingSchedule } from './booking-availability'
import type { HomeModulePrefs } from './home-modules'
import { DEMO_BOOKING_SCHEDULE, DEMO_TRAVEL_RATE_PER_MILE } from './demo-schedule'
import { isPocketBaseConfigured } from './pocketbase'

export type { BookingSchedule }

const SETTINGS_KEY = 'detailing_settings_v1'

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
  /** When true, prompt to log supplies when saving a job. Default off. */
  track_job_supplies?: boolean
  /** Operator app color scheme. Default light (Invoice Fly–style). */
  appearance?: 'light' | 'dark'
  /** Invoice document template id */
  invoice_template?: 'rinse' | 'classic' | 'minimal'
  /** Home dashboard module visibility */
  home_modules?: HomeModulePrefs
  /** Onboarding wizard progress (1–6) */
  onboarding_step?: number
  /** Set when user finishes the plans step */
  onboarding_completed_at?: string
  /** Set when user creates a sample invoice during onboarding */
  onboarding_first_invoice_at?: string
  pb_record_id?: string
}

export const DEFAULT_INVOICE_TERMS = 'Due on receipt. Thank you for your business.'

function useDevDemoSettings(): boolean {
  return process.env.NODE_ENV === 'development' && !isPocketBaseConfigured()
}

const DEFAULTS: AppSettings = {
  business_name: 'Your Detailing Co.',
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

const DEV_DEMO_SETTINGS: Partial<AppSettings> = {
  business_name: 'Rinse',
  business_phone: '(404) 555-0142',
  business_address: '1200 West Peachtree St NW, Atlanta, GA 30309',
  booking_schedule: DEMO_BOOKING_SCHEDULE,
  track_job_supplies: false,
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULTS, ...DEV_DEMO_SETTINGS }
  }
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) {
    return { ...DEFAULTS, ...(useDevDemoSettings() ? DEV_DEMO_SETTINGS : {}) }
  }
  const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as AppSettings
  if (parsed.booking_schedule) {
    parsed.booking_schedule = normalizeBookingSchedule(parsed.booking_schedule)
  }
  return parsed
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export async function loadSettingsAsync(): Promise<AppSettings> {
  const local = loadSettings()
  if (typeof window === 'undefined') return local

  try {
    const { loadSettingsFromPocketBase } = await import('./api/settings-pocketbase')
    const remote = await loadSettingsFromPocketBase()
    if (remote) {
      const merged = { ...local, ...remote, notifications: { ...local.notifications, ...remote.notifications } }
      merged.onboarding_completed_at = remote.onboarding_completed_at ?? local.onboarding_completed_at
      merged.onboarding_first_invoice_at =
        remote.onboarding_first_invoice_at ?? local.onboarding_first_invoice_at
      merged.onboarding_step = remote.onboarding_step ?? local.onboarding_step
      if (merged.booking_schedule) {
        merged.booking_schedule = normalizeBookingSchedule(merged.booking_schedule)
      }
      saveSettings(merged)
      return merged
    }
  } catch {
    // fall back to local
  }
  return local
}

import { assertCanWrite } from './write-guard'

export async function saveSettingsAsync(
  settings: AppSettings,
  logoFile?: File | null,
  options?: { clearLogo?: boolean }
): Promise<AppSettings> {
  assertCanWrite()
  saveSettings(settings)
  if (typeof window === 'undefined') return settings

  try {
    const { saveSettingsToPocketBase } = await import('./api/settings-pocketbase')
    const saved = await saveSettingsToPocketBase(settings, logoFile, options)
    saveSettings(saved)
    return saved
  } catch (err) {
    console.warn('[settings] PocketBase sync failed:', err)
    if (logoFile || options?.clearLogo) throw err
    return settings
  }
}
