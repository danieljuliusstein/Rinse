import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Smartphone } from 'lucide-react'
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
import { notifyBusinessUpdated, getCachedBusinessName } from '@/lib/business-brand'
import { LeftRail } from '@/components/settings/LeftRail'
import { SECTION_META, NAV_ITEMS, type SectionId } from '@/components/settings/types'
import { BusinessProfileSection } from '@/components/settings/sections/BusinessProfileSection'
import { ScheduleSection } from '@/components/settings/sections/ScheduleSection'
import { PreferencesSection } from '@/components/settings/sections/PreferencesSection'
import { NotificationsSection } from '@/components/settings/sections/NotificationsSection'
import { AccountSection } from '@/components/settings/sections/AccountSection'
import { WorkspaceMapSection } from '@/components/settings/sections/WorkspaceMapSection'
import { colors } from '@/theme/colors'
import { useOptionalTour } from '@/components/tour/tour-provider'

function cloneSettings(s: DeskAppSettings): DeskAppSettings {
  return {
    ...s,
    booking_schedule: {
      ...s.booking_schedule,
      work_days: [...s.booking_schedule.work_days],
      open_dates: [...s.booking_schedule.open_dates],
    },
    notifications: { ...s.notifications },
  }
}

function settingsEqual(a: DeskAppSettings, b: DeskAppSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { refresh, loading, clients, jobs, leads } = useData()
  const { setPage, focusSettingsSection, clearFocusSettings } = useDeskNav()
  const { toast, alert } = useUi()
  const tour = useOptionalTour()
  const email = typeof user?.email === 'string' ? user.email : '—'

  const [section, setSection] = useState<SectionId>('business')
  const [search, setSearch] = useState('')
  const [settings, setSettings] = useState<DeskAppSettings>({ ...DEFAULT_SETTINGS })
  const [baseline, setBaseline] = useState<DeskAppSettings>({ ...DEFAULT_SETTINGS })
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
        const next = cloneSettings(loaded)
        setSettings(next)
        setBaseline(cloneSettings(loaded))
        setLoadingSettings(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredNav = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NAV_ITEMS
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q)),
    )
  }, [search])

  useEffect(() => {
    if (filteredNav.length === 0) return
    if (!filteredNav.some((n) => n.id === section)) {
      setSection(filteredNav[0]!.id)
    }
  }, [filteredNav, section])

  const meta = SECTION_META[section]
  const dirty = !settingsEqual(settings, baseline)
  const workspaceName = settings.business_name.trim() || getCachedBusinessName() || 'Workspace'

  function patchSettings(patch: Partial<DeskAppSettings>) {
    if (tour?.active && tour.stop.id === 'settings') {
      toast('Setting updated')
      tour.completeStop('settings')
    }
    setSettings((s) => ({ ...s, ...patch }))
  }

  function patchSchedule(patch: Partial<DeskAppSettings['booking_schedule']>) {
    if (tour?.active && tour.stop.id === 'settings') {
      toast('Schedule updated')
      tour.completeStop('settings')
    }
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

  async function onSave() {
    if (!settings.business_name.trim()) {
      setSection('business')
      alert('Enter your business name before saving.', 'Business name required')
      return
    }
    setSaving(true)

    if (tour?.active) {
      setBaseline(cloneSettings(settings))
      notifyBusinessUpdated(settings.business_name)
      toast('Settings saved — synced with mobile')
      tour.completeStop('settings')
      setSaving(false)
      return
    }

    try {
      const saved = await saveAppSettings(settings)
      const next = cloneSettings(saved)
      setSettings(next)
      setBaseline(cloneSettings(saved))
      notifyBusinessUpdated(saved.business_name)
      toast('Settings saved — synced with mobile')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save settings', 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function onDiscard() {
    setSettings(cloneSettings(baseline))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Settings"
        subtitle="Business, preferences, and account"
        actions={
          <div className="flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-brand-50/50 px-3 py-1.5 text-[11.5px] font-medium text-brand-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-settings-pulse-dot absolute inline-flex h-full w-full rounded-full bg-brand-500" />
            </span>
            <Smartphone size={12} />
            Synced with Rinse mobile where available
          </div>
        }
      />

      <div
        className={`flex flex-1 overflow-hidden ${
          tour?.isArmed('settings-panel') ? 'tour-armed relative z-[55] pointer-events-auto' : ''
        }`}
        data-tour-target="settings-panel"
        onClick={() => {
          if (tour?.active && tour.stop.id === 'settings') {
            tour.completeStop('settings')
          }
        }}
      >
        <LeftRail
          active={section}
          onSelect={(s) => {
            setSection(s)
            if (tour?.active && tour.stop.id === 'settings') {
              toast('Settings section opened')
              tour.completeStop('settings')
            }
          }}
          query={search}
          onQuery={setSearch}
        />

        <div className="settings-thin-scroll flex-1 overflow-y-auto bg-ink-100">
          <div className="mx-auto w-full max-w-2xl px-6 py-7">
            {loadingSettings ? (
              <p className="py-12 text-center text-sm text-ink-400">Loading settings…</p>
            ) : (
              <>
                <div className="mb-5">
                  <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">
                    {meta.title}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-500">{meta.subtitle}</p>
                </div>

                <div key={section} className="animate-settings-fade-rise space-y-4">
                  {section === 'business' && (
                    <BusinessProfileSection settings={settings} setSettings={patchSettings} />
                  )}
                  {section === 'schedule' && (
                    <ScheduleSection
                      settings={settings}
                      setSettings={patchSettings}
                      patchSchedule={patchSchedule}
                      toggleWorkDay={toggleWorkDay}
                      addOpenDate={addOpenDate}
                      removeOpenDate={removeOpenDate}
                    />
                  )}
                  {section === 'preferences' && (
                    <PreferencesSection settings={settings} setSettings={patchSettings} />
                  )}
                  {section === 'notifications' && (
                    <NotificationsSection settings={settings} setSettings={patchSettings} />
                  )}
                  {section === 'account' && (
                    <AccountSection
                      email={email}
                      workspaceName={workspaceName}
                      contacts={clients.length}
                      events={jobs.length}
                      deals={leads.length}
                      onRefresh={() => void refresh()}
                      refreshing={loading}
                      onSignOut={() => void signOut()}
                    />
                  )}
                  {section === 'workspace' && (
                    <WorkspaceMapSection
                      onNavigate={(action) => {
                        if (action.type === 'section') setSection(action.id)
                        else setPage(action.id)
                      }}
                    />
                  )}
                </div>

                {meta.hasSave && (
                  <div className="sticky bottom-0 mt-6 -mx-6 flex items-center justify-end gap-3 border-t border-ink-200 bg-white/95 px-6 py-4 backdrop-blur-sm shadow-[var(--shadow-settings-save)]">
                    <button
                      type="button"
                      onClick={onDiscard}
                      disabled={!dirty || saving}
                      className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => void onSave()}
                      disabled={saving || !dirty}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ background: colors.green }}
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={15} className="animate-settings-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          Save changes
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="h-10" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
