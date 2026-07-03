'use client'

import { useEffect, useState } from 'react'
import {
  isPushEnabled,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client'
import { requestTourReplay, TOUR_REPLAY_EVENT } from '@/lib/product-tour'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import IosInstallSheet from '@/components/IosInstallSheet'
import { ListRow, SectionGroup } from '@/components/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { HOME_MODULES, isHomeModuleEnabled } from '@/lib/home-modules'
import SettingsDetailShell from './SettingsDetailShell'
import SettingsToggle from './SettingsToggle'
import { useSettingsDraft } from './SettingsDraftProvider'

export default function SettingsPreferencesPage() {
  const { theme, setTheme } = useTheme()
  const { settings, ready, update } = useSettingsDraft()
  const [pushOn, setPushOn] = useState(false)
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const [iosInstallOpen, setIosInstallOpen] = useState(false)
  const { canInstall, isStandalone, isIosDevice, hasNativePrompt, install } = usePwaInstall()

  useEffect(() => {
    setPushOn(isPushEnabled())
  }, [])

  const handlePushToggle = async () => {
    setPushMsg(null)
    if (pushOn) {
      await unsubscribeFromPush()
      setPushOn(false)
      setPushMsg('Push notifications disabled')
      return
    }
    const result = await subscribeToPush()
    if (result.ok) {
      setPushOn(true)
      setPushMsg('Push notifications enabled')
    } else {
      setPushMsg(result.error ?? 'Failed to enable push')
    }
  }

  if (!ready || !settings) {
    return (
      <div className="screen page-content settings-screen settings-screen--loading">
        Loading…
      </div>
    )
  }

  return (
    <SettingsDetailShell title="App preferences">
      <div className="settings-panel">
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Dark mode</div>
            <div className="settings-toggle-row__hint">
              {theme === 'dark' ? 'Dark surfaces and green accents' : 'Light mode (default)'}
            </div>
          </div>
          <SettingsToggle
            on={theme === 'dark'}
            onChange={(dark) => setTheme(dark ? 'dark' : 'light')}
            label="Dark mode"
          />
        </div>
        <div className="settings-divider" />
        {(
          [
            ['job_reminder', 'Job reminder (day before)'],
            ['morning_reminder', 'Morning reminder'],
            ['follow_up', 'Follow-up (3 days after)'],
            ['invoice_overdue', 'Invoice overdue'],
            ['low_inventory', 'Low inventory'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="settings-toggle-row">
            <span className="settings-toggle-row__label">{label}</span>
            <SettingsToggle
              on={settings.notifications[key]}
              onChange={(v) => update('notifications', { ...settings.notifications, [key]: v })}
              label={label}
            />
          </div>
        ))}
        <div className="settings-divider" />
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Track supplies on jobs</div>
            <div className="settings-toggle-row__hint">
              Prompt to log product used when saving a job. Off by default.
            </div>
          </div>
          <SettingsToggle
            on={settings.track_job_supplies === true}
            onChange={(v) => update('track_job_supplies', v)}
            label="Track supplies on jobs"
          />
        </div>
        <div className="settings-divider" />
        <p className="settings-panel__lead settings-panel__lead--tight">Home screen modules</p>
        {HOME_MODULES.map((mod) => (
          <div key={mod.id} className="settings-toggle-row">
            <div>
              <div className="settings-toggle-row__label">{mod.label}</div>
              <div className="settings-toggle-row__hint">{mod.description}</div>
            </div>
            <SettingsToggle
              on={isHomeModuleEnabled(settings.home_modules, mod.id)}
              onChange={(v) =>
                update('home_modules', { ...settings.home_modules, [mod.id]: v })
              }
              label={mod.label}
            />
          </div>
        ))}
        <div className="settings-divider" />
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-row__label">Push notifications</div>
            <div className="settings-toggle-row__hint">
              {isPushSupported() ? (pushOn ? 'Subscribed on this device' : 'Not subscribed') : 'Not supported on this device'}
            </div>
          </div>
          <SettingsToggle on={pushOn} onChange={() => void handlePushToggle()} label="Push notifications" />
        </div>
        {pushMsg ? <p className="settings-msg">{pushMsg}</p> : null}
      </div>

      <SectionGroup title="Shortcuts">
        {!isStandalone && canInstall ? (
          <ListRow
            title="Install app on this device"
            onClick={() => {
              if (isIosDevice && !hasNativePrompt) setIosInstallOpen(true)
              else void install()
            }}
          />
        ) : null}
        <ListRow
          title="Replay app tour"
          onClick={() => {
            requestTourReplay()
            window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))
          }}
        />
      </SectionGroup>

      <IosInstallSheet open={iosInstallOpen} onOpenChange={setIosInstallOpen} />
    </SettingsDetailShell>
  )
}
