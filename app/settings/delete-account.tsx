import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { FormField } from '@/src/components/FormField'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, Button, Card } from '@/src/components/ui'
import { getBusinessName } from '@/src/lib/settings-api'
import { deleteAccount } from '@/src/lib/share'
import { colors, spacing } from '@/src/theme/colors'

export default function DeleteAccountScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getBusinessName()
      .then(setBusinessName)
      .finally(() => setLoading(false))
  }, [])

  const canDelete =
    confirmed &&
    businessName.length > 0 &&
    confirmName.trim().toLowerCase() === businessName.trim().toLowerCase()

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete account permanently?',
      'This removes your organization and all data from Rinse. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true)
              setError(null)
              try {
                await deleteAccount(confirmName.trim())
                await signOut({ force: true })
                router.replace('/(auth)/login')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Delete failed')
              } finally {
                setDeleting(false)
              }
            })()
          },
        },
      ]
    )
  }, [confirmName, router, signOut])

  if (loading) {
    return (
      <SettingsScreen title="Delete account">
        <AppText variant="body" style={styles.muted}>
          Loading…
        </AppText>
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Delete account" subtitle="Permanent and irreversible">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <AppText variant="body">
            Deleting your account removes your business, clients, jobs, invoices, and all related data from Rinse.
          </AppText>
          <AppText variant="caption" style={styles.hint}>
            Billing is managed at rinsehq.com or Apple — cancel any subscription before deleting. Cancel alone leaves a read-only vault; delete permanently removes data.
          </AppText>
        </Card>

        {businessName ? (
          <Card>
            <AppText variant="sectionLabel">Type business name to confirm</AppText>
            <AppText variant="bodySemiBold" style={styles.businessName}>
              {businessName}
            </AppText>
            <FormField
              label="Business name"
              value={confirmName}
              onChangeText={setConfirmName}
              placeholder={businessName}
            />
          </Card>
        ) : (
          <Card>
            <AppText variant="body">Could not load business name. Connect to the internet and try again.</AppText>
          </Card>
        )}

        <View style={styles.switchRow}>
          <AppText variant="bodySemiBold" style={styles.switchLabel}>
            I understand this is permanent
          </AppText>
          <Switch
            value={confirmed}
            onValueChange={setConfirmed}
            trackColor={{ true: colors.danger, false: colors.border }}
          />
        </View>

        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <Button
          label="Delete my account"
          variant="danger"
          disabled={!canDelete}
          loading={deleting}
          onPress={handleDelete}
        />

        <Pressable onPress={() => router.back()} style={styles.cancel}>
          <AppText variant="bodySemiBold" style={styles.cancelText}>
            Cancel
          </AppText>
        </Pressable>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  businessName: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  switchLabel: {
    flex: 1,
    paddingRight: spacing.md,
  },
  error: {
    color: colors.danger,
  },
  muted: {
    color: colors.textMuted,
    padding: spacing.md,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.greenText,
  },
})
