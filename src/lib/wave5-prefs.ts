import type {
  BusinessPolicies,
  PortalPermissions,
  ReviewPrefs,
  SopTemplate,
  TaxPreset,
  TechRosterEntry,
  TipPrefs,
} from '@rinse/core'

export const DEFAULT_BUSINESS_POLICIES: BusinessPolicies = {
  deposit_mode: 'percent',
  deposit_value: 25,
  collect_at_booking: false,
  cancel_window_hours: 24,
  no_show_fee: 0,
  no_show_fee_copy: '',
}

export const DEFAULT_TIP_PREFS: TipPrefs = {
  suggest_on_pay_link: false,
  presets: [15, 18, 20],
  tips_go_to: '',
}

export const DEFAULT_PORTAL_PERMISSIONS: PortalPermissions = {
  pay: true,
  photos: true,
  reschedule: false,
}

export const DEFAULT_REVIEW_PREFS: ReviewPrefs = {
  review_link: '',
  review_rating_avg: 0,
  review_count: 0,
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizeBusinessPolicies(raw: unknown): BusinessPolicies {
  const r = asRecord(raw)
  if (!r) return { ...DEFAULT_BUSINESS_POLICIES }
  const mode = r.deposit_mode === 'fixed' ? 'fixed' : 'percent'
  return {
    deposit_mode: mode,
    deposit_value: asNumber(r.deposit_value, DEFAULT_BUSINESS_POLICIES.deposit_value),
    collect_at_booking: asBoolean(r.collect_at_booking, DEFAULT_BUSINESS_POLICIES.collect_at_booking),
    cancel_window_hours: asNumber(
      r.cancel_window_hours,
      DEFAULT_BUSINESS_POLICIES.cancel_window_hours,
    ),
    no_show_fee: asNumber(r.no_show_fee, DEFAULT_BUSINESS_POLICIES.no_show_fee),
    no_show_fee_copy: asString(r.no_show_fee_copy, DEFAULT_BUSINESS_POLICIES.no_show_fee_copy),
  }
}

export function normalizeTipPrefs(raw: unknown): TipPrefs {
  const r = asRecord(raw)
  if (!r) return { ...DEFAULT_TIP_PREFS, presets: [...DEFAULT_TIP_PREFS.presets] }
  const presets = Array.isArray(r.presets)
    ? r.presets.map((p) => asNumber(p, 0)).filter((n) => n > 0)
    : [...DEFAULT_TIP_PREFS.presets]
  return {
    suggest_on_pay_link: asBoolean(r.suggest_on_pay_link, DEFAULT_TIP_PREFS.suggest_on_pay_link),
    presets: presets.length > 0 ? presets : [...DEFAULT_TIP_PREFS.presets],
    tips_go_to: asString(r.tips_go_to, DEFAULT_TIP_PREFS.tips_go_to),
  }
}

export function normalizePortalPermissions(raw: unknown): PortalPermissions {
  const r = asRecord(raw)
  if (!r) return { ...DEFAULT_PORTAL_PERMISSIONS }
  return {
    pay: asBoolean(r.pay, DEFAULT_PORTAL_PERMISSIONS.pay),
    photos: asBoolean(r.photos, DEFAULT_PORTAL_PERMISSIONS.photos),
    reschedule: asBoolean(r.reschedule, DEFAULT_PORTAL_PERMISSIONS.reschedule),
  }
}

export function normalizeTaxPresets(raw: unknown): TaxPreset[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const r = asRecord(row)
      if (!r) return null
      const name = asString(r.name).trim()
      if (!name) return null
      return { name, rate: asNumber(r.rate, 0) }
    })
    .filter((row): row is TaxPreset => row != null)
}

export function normalizeSopTemplates(raw: unknown): SopTemplate[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const r = asRecord(row)
      if (!r) return null
      const id = asString(r.id).trim()
      const name = asString(r.name).trim()
      if (!id || !name) return null
      const items = Array.isArray(r.items)
        ? r.items.map((item) => asString(item).trim()).filter(Boolean)
        : []
      return { id, name, items }
    })
    .filter((row): row is SopTemplate => row != null)
}

export function normalizeTechRoster(raw: unknown): TechRosterEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const r = asRecord(row)
      if (!r) return null
      const id = asString(r.id).trim()
      const name = asString(r.name).trim()
      if (!id || !name) return null
      return { id, name, color: asString(r.color, '#22c55e') }
    })
    .filter((row): row is TechRosterEntry => row != null)
}

export function normalizeReviewPrefs(raw: unknown): ReviewPrefs {
  const r = asRecord(raw)
  if (!r) return { ...DEFAULT_REVIEW_PREFS }
  return {
    review_link: asString(r.review_link, DEFAULT_REVIEW_PREFS.review_link),
    review_rating_avg: asNumber(r.review_rating_avg, DEFAULT_REVIEW_PREFS.review_rating_avg),
    review_count: asNumber(r.review_count, DEFAULT_REVIEW_PREFS.review_count),
  }
}
