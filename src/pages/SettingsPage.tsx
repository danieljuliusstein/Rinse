import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Header } from '../App'
import { useAuth } from '@/providers/AuthProvider'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import {
  DEFAULT_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type DeskAppSettings,
} from '@/lib/settings-api'
import {
  ARRIVAL_WINDOW_OPTIONS,
  BUFFER_OPTIONS,
  DRIVE_TIME_PAD_OPTIONS,
  SLOT_INTERVALS,
  WEEKDAY_LABELS,
  lunchBreakEnabled,
} from '@/lib/booking-schedule'
import { notifyBusinessUpdated } from '@/lib/business-brand'
import { colors } from '@/theme/colors'
import { SETTINGS_GROUPS, SETTINGS_ROWS } from '@/lib/settings-hub'
import type { PageId } from '@/lib/types'

type SectionId = 'business' | 'schedule' | 'preferences' | 'notifications' | 'account' | 'workspace'

type NavItem = {
  id: SectionId
  label: string
  group: string
  keywords: string
}

const NAV: NavItem[] = [
  { id: 'business', label: 'Business profile', group: 'Business', keywords: 'name phone email address invoice template brand' },
  { id: 'schedule', label: 'Schedule', group: 'Business', keywords: 'hours work days lunch buffer booking open dates' },
  { id: 'preferences', label: 'Preferences', group: 'Business', keywords: 'timezone quiet hours language travel supplies locale' },
  { id: 'notifications', label: 'Notifications', group: 'Preferences', keywords: 'reminders follow up overdue inventory morning job' },
  { id: 'account', label: 'Account', group: 'Account', keywords: 'email sign out refresh operator login' },
  { id: 'workspace', label: 'Workspace map', group: 'Account', keywords: 'mobile hub schedule team billing inventory pipeline' },
]

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-2.5 text-left"
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <span
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? '' : 'bg-gray-200'}`}
        style={checked ? { background: colors.green } : undefined}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500 bg-white'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { refresh, loading, clients, jobs, leads } = useData()
  const { setPage, focusSettingsSection, clearFocusSettings } = useDeskNav()
  const { toast, alert } = useUi()
  const email = typeof user?.email === 'string' ? user.email : '—'

  const [section, setSection] = useState<SectionId>('business')
  const [search, setSearch] = useState('')
  const [settings, setSettings] = useState<DeskAppSettings>({ ...DEFAULT_SETTINGS })
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!focusSettingsSection) return
    setSection(focusSettingsSection)
    clearFocusSettings()
  }, [focusSettingsSection, clearFocusSettings])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingSettings(true)
      const loaded = await loadAppSettings()
      if (!cancelled) {
        setSettings(loaded)
        setLoadingSettings(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredNav = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NAV
    return NAV.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.includes(q),
    )
  }, [search])

  useEffect(() => {
    if (filteredNav.length === 0) return
    if (!filteredNav.some((n) => n.id === section)) {
      setSection(filteredNav[0]!.id)
    }
  }, [filteredNav, section])

  const navGroups = useMemo(() => {
    const groups: { label: string; items: NavItem[] }[] = []
    for (const item of filteredNav) {
      const existing = groups.find((g) => g.label === item.group)
      if (existing) existing.items.push(item)
      else groups.push({ label: item.group, items: [item] })
    }
    return groups
  }, [filteredNav])

  async function onSave() {
    setSaving(true)
    try {
      const saved = await saveAppSettings(settings)
      setSettings(saved)
      notifyBusinessUpdated(saved.business_name)
      toast('Settings saved — synced with mobile')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save settings', 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function goWorkspaceRow(rowId: string) {
    if (rowId === 'account') setSection('account')
    else if (rowId === 'quiet-hours' || rowId === 'preferences' || rowId === 'language') setSection('preferences')
    else if (rowId === 'business' || rowId === 'invoicing') setSection('business')
    else if (rowId === 'schedule') setSection('schedule')
    else if (rowId === 'pipeline') setPage('deals' as PageId)
    else if (rowId === 'support') setPage('help' as PageId)
    else if (rowId === 'messages') setPage('chat' as PageId)
    else if (rowId === 'expenses') setPage('receipts' as PageId)
  }

  function patchSchedule(patch: Partial<DeskAppSettings['booking_schedule']>) {
    setSettings((s) => ({
      ...s,
      booking_schedule: { ...s.booking_schedule, ...patch },
    }))
  }

  function toggleWorkDay(day: number) {
    setSettings((s) => {
      const set = new Set(s.booking_schedule.work_days)
      if (set.has(day)) set.delete(day)
      else set.add(day)
      const work_days = [...set].sort((a, b) => a - b)
      return {
        ...s,
        booking_schedule: {
          ...s.booking_schedule,
          work_days: work_days.length > 0 ? work_days : [day],
        },
      }
    })
  }

  function addOpenDate(date: string) {
    const day = date.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return
    setSettings((s) => {
      const open_dates = [...new Set([...s.booking_schedule.open_dates, day])].sort()
      return { ...s, booking_schedule: { ...s.booking_schedule, open_dates } }
    })
  }

  function removeOpenDate(date: string) {
    setSettings((s) => ({
      ...s,
      booking_schedule: {
        ...s.booking_schedule,
        open_dates: s.booking_schedule.open_dates.filter((d) => d !== date),
      },
    }))
  }

  const activeLabel = NAV.find((n) => n.id === section)?.label ?? 'Settings'

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Settings" subtitle="Business, preferences, and account" />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-gray-100 bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search settings…"
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
              />
              <svg
                className="absolute left-2 top-2 text-gray-400"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {navGroups.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-3">No matching settings</p>
            ) : (
              navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSection(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                          section === item.id
                            ? 'bg-green-50 text-green-800 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </nav>
        </aside>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto w-full max-w-2xl px-6 py-6">
            {loadingSettings ? (
              <p className="text-sm text-gray-400 text-center py-12">Loading settings…</p>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-1">
                  <h2 className="text-base font-semibold text-gray-900">{activeLabel}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Synced with Rinse mobile where available</p>
                </div>

                {section === 'business' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3.5">
                    <Field label="Business name">
                      <input
                        className={inputClass}
                        value={settings.business_name}
                        onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))}
                        placeholder="Your shop name"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone">
                        <input
                          className={inputClass}
                          value={settings.business_phone}
                          onChange={(e) => setSettings((s) => ({ ...s, business_phone: e.target.value }))}
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          type="email"
                          className={inputClass}
                          value={settings.business_email}
                          onChange={(e) => setSettings((s) => ({ ...s, business_email: e.target.value }))}
                        />
                      </Field>
                    </div>
                    <Field label="Address">
                      <input
                        className={inputClass}
                        value={settings.business_address}
                        onChange={(e) => setSettings((s) => ({ ...s, business_address: e.target.value }))}
                        placeholder="Depot for Calendar Route start/end"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Used as route start/end when optimizing the day’s stops on Calendar → Route.
                      </p>
                    </Field>
                    <Field label="Invoice terms footer">
                      <textarea
                        rows={3}
                        className={`${inputClass} resize-none`}
                        value={settings.invoice_terms_footer}
                        onChange={(e) => setSettings((s) => ({ ...s, invoice_terms_footer: e.target.value }))}
                      />
                    </Field>
                    <Field label="Invoice template">
                      <select
                        className={inputClass}
                        value={settings.invoice_template}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            invoice_template: e.target.value as DeskAppSettings['invoice_template'],
                          }))
                        }
                      >
                        <option value="rinse">Rinse</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </Field>
                  </section>
                )}

                {section === 'schedule' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <p className="text-xs text-gray-500">
                      Work hours sync to mobile via <span className="font-medium text-gray-700">app_settings</span>.
                      Time-off blocks are managed on Calendar.
                    </p>

                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Work days</p>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAY_LABELS.map((w) => {
                          const on = settings.booking_schedule.work_days.includes(w.day)
                          return (
                            <button
                              key={w.day}
                              type="button"
                              onClick={() => toggleWorkDay(w.day)}
                              className={`min-w-[2.5rem] px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                on
                                  ? 'border-green-500 bg-green-50 text-green-800'
                                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                              }`}
                              title={w.label}
                            >
                              {w.short}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Day starts">
                        <input
                          type="time"
                          className={inputClass}
                          value={settings.booking_schedule.start_time}
                          onChange={(e) => patchSchedule({ start_time: e.target.value })}
                        />
                      </Field>
                      <Field label="Day ends">
                        <input
                          type="time"
                          className={inputClass}
                          value={settings.booking_schedule.end_time}
                          onChange={(e) => patchSchedule({ end_time: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Toggle
                      checked={lunchBreakEnabled(settings.booking_schedule)}
                      onChange={(v) =>
                        patchSchedule(
                          v
                            ? { lunch_start: '12:00', lunch_end: '13:00' }
                            : { lunch_start: '', lunch_end: '' },
                        )
                      }
                      label="Lunch break"
                      hint="Blocks mid-day availability for booking"
                    />
                    {lunchBreakEnabled(settings.booking_schedule) && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Lunch start">
                          <input
                            type="time"
                            className={inputClass}
                            value={settings.booking_schedule.lunch_start || '12:00'}
                            onChange={(e) => patchSchedule({ lunch_start: e.target.value })}
                          />
                        </Field>
                        <Field label="Lunch end">
                          <input
                            type="time"
                            className={inputClass}
                            value={settings.booking_schedule.lunch_end || '13:00'}
                            onChange={(e) => patchSchedule({ lunch_end: e.target.value })}
                          />
                        </Field>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Slot interval">
                        <select
                          className={inputClass}
                          value={settings.booking_schedule.slot_interval_minutes}
                          onChange={(e) =>
                            patchSchedule({ slot_interval_minutes: Number(e.target.value) || 120 })
                          }
                        >
                          {SLOT_INTERVALS.map((n) => (
                            <option key={n} value={n}>
                              {n} min
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Arrival window">
                        <select
                          className={inputClass}
                          value={settings.booking_schedule.arrival_window_minutes}
                          onChange={(e) =>
                            patchSchedule({ arrival_window_minutes: Number(e.target.value) || 120 })
                          }
                        >
                          {ARRIVAL_WINDOW_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n} min
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Job buffer">
                        <select
                          className={inputClass}
                          value={settings.booking_schedule.buffer_minutes}
                          onChange={(e) =>
                            patchSchedule({ buffer_minutes: Number(e.target.value) || 0 })
                          }
                        >
                          {BUFFER_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n} min
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Drive-time pad">
                        <select
                          className={inputClass}
                          value={settings.booking_schedule.drive_time_pad_minutes}
                          onChange={(e) =>
                            patchSchedule({ drive_time_pad_minutes: Number(e.target.value) || 0 })
                          }
                        >
                          {DRIVE_TIME_PAD_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n} min
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Max jobs per day (0 = unlimited)">
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={settings.booking_schedule.max_jobs_per_day}
                        onChange={(e) =>
                          patchSchedule({ max_jobs_per_day: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </Field>

                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">Extra open dates</p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        Dates that stay bookable even when the weekday is off.
                      </p>
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          type="date"
                          className={inputClass}
                          id="schedule-open-date"
                          onChange={(e) => {
                            if (e.target.value) {
                              addOpenDate(e.target.value)
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>
                      {settings.booking_schedule.open_dates.length === 0 ? (
                        <p className="text-[11px] text-gray-400">None yet.</p>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {settings.booking_schedule.open_dates.map((d) => (
                            <li key={d}>
                              <button
                                type="button"
                                onClick={() => removeOpenDate(d)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600"
                                title="Remove"
                              >
                                {d}
                                <span aria-hidden>×</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                )}

                {section === 'preferences' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3.5">
                    <Field label="Timezone">
                      <input
                        className={inputClass}
                        value={settings.timezone}
                        onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                        placeholder="America/New_York"
                      />
                    </Field>
                    <Toggle
                      checked={settings.quiet_hours_enabled}
                      onChange={(v) => setSettings((s) => ({ ...s, quiet_hours_enabled: v }))}
                      label="Quiet hours"
                      hint="Pause SMS outside the window"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Quiet start hour (0–23)">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          className={inputClass}
                          value={settings.quiet_start_hour}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, quiet_start_hour: Number(e.target.value) || 0 }))
                          }
                        />
                      </Field>
                      <Field label="Quiet end hour (0–23)">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          className={inputClass}
                          value={settings.quiet_end_hour}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, quiet_end_hour: Number(e.target.value) || 0 }))
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Document language">
                      <select
                        className={inputClass}
                        value={settings.document_locale}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            document_locale: e.target.value === 'es' ? 'es' : 'en',
                          }))
                        }
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </Field>
                    <Field label="Travel rate per mile">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={inputClass}
                        value={settings.travel_rate_per_mile}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, travel_rate_per_mile: Number(e.target.value) || 0 }))
                        }
                      />
                    </Field>
                    <Toggle
                      checked={settings.track_job_supplies}
                      onChange={(v) => setSettings((s) => ({ ...s, track_job_supplies: v }))}
                      label="Track job supplies"
                      hint="Inventory usage on jobs"
                    />
                  </section>
                )}

                {section === 'notifications' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-1">
                    {(
                      [
                        ['job_reminder', 'Job reminders'],
                        ['morning_reminder', 'Morning reminder'],
                        ['follow_up', 'Follow-ups'],
                        ['invoice_overdue', 'Overdue invoices'],
                        ['low_inventory', 'Low inventory'],
                      ] as const
                    ).map(([key, label]) => (
                      <Toggle
                        key={key}
                        checked={settings.notifications[key]}
                        onChange={(v) =>
                          setSettings((s) => ({
                            ...s,
                            notifications: { ...s.notifications, [key]: v },
                          }))
                        }
                        label={label}
                      />
                    ))}
                  </section>
                )}

                {section === 'account' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{email}</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {clients.length} contacts · {jobs.length} events · {leads.length} deals
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={loading}
                        className="px-3 py-2 text-xs font-semibold text-white rounded-lg"
                        style={{ background: colors.green }}
                      >
                        {loading ? 'Refreshing…' : 'Refresh data'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600"
                      >
                        Sign out
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-red-600 mb-1">Danger zone</p>
                      <p className="text-xs text-gray-400 mb-2">
                        Sign out ends this desktop session. Data stays in your organization.
                      </p>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50"
                      >
                        Sign out of desktop
                      </button>
                    </div>
                  </section>
                )}

                {section === 'workspace' && (
                  <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <p className="text-xs text-gray-500 text-center">
                      Desktop edits shared fields above. Jump to editable areas or open related pages.
                    </p>
                    {SETTINGS_GROUPS.map((g) => (
                      <div key={g.id}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{g.label}</p>
                        <div className="space-y-1.5">
                          {SETTINGS_ROWS.filter((r) => r.group === g.id).map((row) => {
                            const editable = [
                              'business',
                              'schedule',
                              'account',
                              'quiet-hours',
                              'preferences',
                              'language',
                              'invoicing',
                              'pipeline',
                              'support',
                              'messages',
                              'expenses',
                            ].includes(row.id)
                            return (
                              <button
                                key={row.id}
                                type="button"
                                disabled={!editable}
                                onClick={() => goWorkspaceRow(row.id)}
                                className={`w-full text-left rounded-lg border px-3 py-2.5 ${
                                  editable
                                    ? 'border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                                    : 'border-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-medium text-gray-800">{row.title}</p>
                                    <p className="text-xs text-gray-400">{row.subtitle}</p>
                                  </div>
                                  <span className="text-[10px] font-medium text-gray-400">
                                    {editable ? 'Open' : 'Mobile only'}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {section !== 'account' && section !== 'workspace' && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void onSave()}
                      className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
                      style={{ background: colors.green }}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
