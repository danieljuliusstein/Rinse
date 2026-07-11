import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { SettingsPanelDivider, SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { AppText, Card, ListRow, PrimaryButton, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { loadAppearance, saveAppearance, type AppearanceMode } from '@/src/lib/appearance-store'
import { HOME_MODULES } from '@/src/lib/home-modules'
import {
  isPushEnabled,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/src/lib/push-client'
import { dispatchTourReplayEvent, requestTourReplay } from '@/src/lib/product-tour-replay'
import { SignOutBlockedError } from '@/src/lib/auth'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import {
  loadSettings,
  saveSettings,
  isHomeModuleEnabled,
  type HomeModulePrefs,
} from '@/src/lib/settings-store'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const NOTIFICATION_TOGGLES = [
  { key: 'job_reminder' as const, label: 'Job reminder (day before)' },
  { key: 'morning_reminder' as const, label: 'Morning reminder' },
  { key: 'follow_up' as const, label: 'Follow-up (3 days after)' },
  { key: 'invoice_overdue' as const, label: 'Invoice overdue' },
  { key: 'low_inventory' as const, label: 'Low inventory' },
]

export default function SettingsPreferencesScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [appearance, setAppearance] = useState<AppearanceMode>('light')
  const [notifications, setNotifications] = useState({
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  })
  const [trackSupplies, setTrackSupplies] = useState(false)
  const [homeModules, setHomeModules] = useState<HomeModulePrefs>({})
  const [pushOn, setPushOn] = useState(false)
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const pushSupported = isPushSupported()

  const refresh = useCallback(async () => {
    const [settings, mode, pushEnabled] = await Promise.all([
      loadSettings(),
      loadAppearance(),
      isPushEnabled(),
    ])
    setNotifications(settings.notifications)
    setTrackSupplies(settings.track_job_supplies ?? false)
    setHomeModules(settings.home_modules ?? {})
    setAppearance(mode)
    setPushOn(pushEnabled)
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const handlePushToggle = async (next: boolean) => {
    setPushMsg(null)
    if (!pushSupported) return
    if (!next) {
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
      setPushOn(false)
      setPushMsg(result.error ?? 'Failed to enable push')
    }
  }

  const handleReplayTour = async () => {
    await requestTourReplay()
    dispatchTourReplayEvent()
    router.replace('/(tabs)')
  }

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        saveAppearance(appearance),
        saveSettings({ notifications, track_job_supplies: trackSupplies, home_modules: homeModules }),
      ])
      Alert.alert('Saved', 'Preferences updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    if (pendingCount > 0) {
      Alert.alert('Unsynced changes', 'Sync or discard pending changes before signing out.')
      return
    }
    Alert.alert(
      'Log out?',
      'Log out on this device? You can keep browsing, but your data will not load until you sign in again.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSigningOut(true)
              try {
                await signOut()
              } catch (e) {
                if (e instanceof SignOutBlockedError) Alert.alert('Cannot sign out', e.message)
              } finally {
                setSigningOut(false)
              }
            })()
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <SettingsScreen title="App preferences">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  const pushHint = pushSupported
    ? pushOn
      ? 'Subscribed on this device'
      : 'Not subscribed'
    : 'Not supported on this device'

  return (
    <SettingsScreen title="App preferences">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.panel}>
          <SettingsToggleRow
            label="Dark mode"
            hint={appearance === 'dark' ? 'Dark surfaces and green accents' : 'Light mode (default)'}
            value={appearance === 'dark'}
            onChange={(dark) => setAppearance(dark ? 'dark' : 'light')}
          />

          <SettingsPanelDivider />

          {NOTIFICATION_TOGGLES.map((item) => (
            <SettingsToggleRow
              key={item.key}
              label={item.label}
              value={notifications[item.key]}
              onChange={(v) => setNotifications((n) => ({ ...n, [item.key]: v }))}
            />
          ))}

          <SettingsPanelDivider />

          <SettingsToggleRow
            label="Track supplies on jobs"
            hint="Prompt to log product used when saving a job. Off by default."
            value={trackSupplies}
            onChange={setTrackSupplies}
          />

          <SettingsPanelDivider />

          <AppText style={styles.sectionLead}>Home screen modules</AppText>
          {HOME_MODULES.map((mod) => (
            <SettingsToggleRow
              key={mod.id}
              label={mod.label}
              hint={mod.description}
              value={isHomeModuleEnabled(homeModules, mod.id)}
              onChange={(v) => setHomeModules((prev) => ({ ...prev, [mod.id]: v }))}
            />
          ))}

          <SettingsPanelDivider />

          <SettingsToggleRow
            label="Push notifications"
            hint={pushHint}
            value={pushOn}
            onChange={(v) => void handlePushToggle(v)}
            disabled={!pushSupported}
          />
          {pushMsg ? <AppText style={styles.pushMsg}>{pushMsg}</AppText> : null}
        </Card>

        <SectionGroup title="Shortcuts">
          <ListRow title="Replay app tour" onPress={() => void handleReplayTour()} />
        </SectionGroup>

        <PrimaryButton label={saving ? 'Saving…' : 'Save settings'} onPress={() => void save()} loading={saving} />

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && !signingOut ? styles.logoutPressed : null]}
        >
          <AppText variant="bodyMedium" style={styles.logoutLabel}>
            {signingOut ? 'Signing out…' : 'Log out'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  panel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionLead: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  pushMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    paddingVertical: 13,
    borderRadius: radii.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  logoutPressed: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
  },
  logoutLabel: {
    color: colors.danger,
    fontFamily: fonts.bodyMedium,
  },
})
