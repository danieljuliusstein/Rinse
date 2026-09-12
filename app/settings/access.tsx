import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Check } from '@/src/icons'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { DeveloperToolsPanel } from '@/src/components/settings/DeveloperToolsPanel'
import {
  AppText,
  Button,
  Card,
  ListRow,
  ScreenLoading,
  SecondaryButton,
  SectionGroup,
} from '@/src/components/ui'
import { listClients, listJobs } from '@/src/lib/api'
import { SignOutBlockedError } from '@/src/lib/auth'
import { isDemoModeEnabled, setDemoModeEnabled } from '@/src/lib/demo-mode'
import {
  exportBusinessJson,
  formatClientsCsv,
  shareTextExport,
  triggerServerBackup,
} from '@/src/lib/data-export'
import { listInvoices } from '@/src/lib/invoices-api'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import { deleteAccount } from '@/src/lib/share'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { isVaultAccess } from '@/src/lib/subscription-types'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function formatBackupDate(iso?: string): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Never'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SettingsAccessScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { org } = useOrgSubscription()
  const vault = isVaultAccess(org)
  const { pendingCount, syncing, lastError, syncNow, refresh: refreshOffline } = useOffline()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'backup' | 'json' | 'csv' | null>(null)
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>()
  const [businessName, setBusinessName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const refresh = useCallback(async () => {
    const [settings, demo] = await Promise.all([loadSettings(), isDemoModeEnabled()])
    setLastBackupAt(settings.last_backup_at)
    setBusinessName(settings.business_name?.trim() ?? '')
    setDemoMode(demo)
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const runExport = async (kind: 'backup' | 'json' | 'csv') => {
    setBusy(kind)
    setMessage(null)
    setError(null)
    try {
      if (kind === 'backup') {
        const result = await triggerServerBackup()
        if (!result.ok) throw new Error(result.error ?? 'Backup failed')
        const now = new Date().toISOString()
        await saveSettings({ last_backup_at: now })
        setLastBackupAt(now)
        setMessage('PocketBase backup downloaded')
        return
      }

      if (kind === 'json') {
        const [clients, jobs, invoices, settings] = await Promise.all([
          listClients(500),
          listJobs(500),
          listInvoices(),
          loadSettings(),
        ])
        await exportBusinessJson({
          exported_at: new Date().toISOString(),
          settings,
          clients,
          jobs,
          invoices,
        })
        const now = new Date().toISOString()
        await saveSettings({ last_backup_at: now })
        setLastBackupAt(now)
        setMessage('Export ready to share')
        return
      }

      const clients = await listClients(500)
      await shareTextExport('rinse-clients.csv', formatClientsCsv(clients), 'text/csv')
      setMessage('Clients CSV ready to share')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  const handleToggleDemoMode = async () => {
    const next = !demoMode
    await setDemoModeEnabled(next)
    setDemoMode(next)
    if (next) {
      setMessage('Sample business overlay on — demo labels may appear in screenshots.')
    } else {
      setMessage('Sample business overlay off')
    }
  }

  const handleSyncNow = async () => {
    setSyncErrors([])
    try {
      const result = await syncNow()
      if (result.errors.length > 0) setSyncErrors(result.errors)
    } catch (e) {
      setSyncErrors([e instanceof Error ? e.message : 'Sync failed'])
    }
  }

  const canDelete =
    !deleting &&
    deleteConfirmed &&
    businessName.length > 0 &&
    deleteConfirmName.trim() === businessName.trim()

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteMsg(null)
    try {
      await deleteAccount(deleteConfirmName.trim())
      await signOut({ force: true })
      router.replace('/(auth)/login')
    } catch (e) {
      setDeleteMsg(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
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
      <SettingsScreen title="Access and data">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Access and data">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {vault ? (
          <Card style={styles.dataPanel}>
            <AppText style={styles.vaultTitle}>Read-only vault</AppText>
            <AppText style={styles.statusLine}>
              Your subscription is canceled. Export stays available below. Resubscribe from Billing to
              create or edit jobs, clients, and invoices.
            </AppText>
          </Card>
        ) : null}

        <Card style={styles.dataPanel}>
          <AppText style={styles.statusLine}>Last backup: {formatBackupDate(lastBackupAt)}</AppText>
          <View style={styles.actions}>
            <SecondaryButton
              label={busy === 'backup' ? 'Backing up…' : 'Backup now (PocketBase)'}
              loading={busy === 'backup'}
              disabled={busy !== null && busy !== 'backup'}
              onPress={() => void runExport('backup')}
            />
            <SecondaryButton
              label={busy === 'json' ? 'Exporting…' : 'Export all data (local JSON)'}
              loading={busy === 'json'}
              disabled={busy !== null && busy !== 'json'}
              onPress={() => void runExport('json')}
            />
            <SecondaryButton
              label={busy === 'csv' ? 'Exporting…' : 'Export clients (CSV)'}
              loading={busy === 'csv'}
              disabled={busy !== null && busy !== 'csv'}
              onPress={() => void runExport('csv')}
            />
            {demoMode ? (
              <Button
                label="Sample business overlay on"
                variant="primary"
                onPress={() => void handleToggleDemoMode()}
              />
            ) : (
              <SecondaryButton
                label="Sample business overlay"
                onPress={() => void handleToggleDemoMode()}
              />
            )}
          </View>
          {message ? <AppText style={styles.message}>{message}</AppText> : null}
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </Card>

        <SectionGroup title="Legal">
          <ListRow title="Privacy policy" onPress={() => router.push('/settings/privacy')} isLast />
        </SectionGroup>

        <DeveloperToolsPanel
          pendingCount={pendingCount}
          syncing={syncing}
          lastError={lastError}
          syncErrors={syncErrors}
          onSyncNow={handleSyncNow}
          onRefresh={refreshOffline}
        />

        <Card style={styles.deleteCard}>
          <AppText style={styles.deleteTitle}>Delete account</AppText>
          <AppText style={styles.deleteLead}>
            Permanently delete your organization, jobs, clients, and settings. This cannot be undone.
          </AppText>
          <SecondaryButton
            label="Export all data first (recommended)"
            disabled={busy !== null}
            onPress={() => void runExport('json')}
          />
          <View style={styles.deleteField}>
            <Text style={styles.deleteFieldLabel}>
              Type your business name to confirm:{' '}
              <Text style={styles.deleteFieldStrong}>{businessName || '—'}</Text>
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmName}
              onChangeText={setDeleteConfirmName}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="off"
            />
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: deleteConfirmed }}
            onPress={() => setDeleteConfirmed((v) => !v)}
            style={styles.checkRow}
          >
            <View style={[styles.checkbox, deleteConfirmed ? styles.checkboxOn : null]}>
              {deleteConfirmed ? <Check size={12} color="#fff" weight="bold" /> : null}
            </View>
            <AppText style={styles.checkLabel}>I understand this is permanent</AppText>
          </Pressable>
          <Button
            label={deleting ? 'Deleting…' : 'Delete account permanently'}
            variant="danger"
            disabled={!canDelete}
            loading={deleting}
            onPress={() => void handleDeleteAccount()}
          />
          {deleteMsg ? <AppText style={styles.error}>{deleteMsg}</AppText> : null}
        </Card>

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
  dataPanel: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  statusLine: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  vaultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
    marginBottom: 4,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  deleteCard: {
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: 0,
  },
  deleteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
    fontFamily: fonts.bodySemiBold,
  },
  deleteLead: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  deleteField: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deleteFieldLabel: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  deleteFieldStrong: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  deleteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxOn: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    paddingVertical: 13,
    borderRadius: 14,
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
  },
})
