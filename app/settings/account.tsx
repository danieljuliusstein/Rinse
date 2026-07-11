import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { FormField } from '@/src/components/FormField'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import {
  AppText,
  Card,
  ListRow,
  PlanBadge,
  resolvePlanBadgeKind,
  SecondaryButton,
  SectionGroup,
  SheetSubmitButton,
} from '@/src/components/ui'
import { SignOutBlockedError, changePassword, getCurrentUserEmail, requestPasswordReset } from '@/src/lib/auth'
import { PLAN_LABELS, FREE_PLAN, STARTER_TRIAL_DAYS } from '@/src/lib/plans'
import { fetchOrgSubscription } from '@/src/lib/subscription-fetch'
import {
  formatTrialLengthLabel,
  isFoundingMember,
  parseSubscriptionEndDate,
  type OrgSubscription,
} from '@/src/lib/subscription-types'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function formatTrialEndDate(value: string | undefined): string | null {
  const end = parseSubscriptionEndDate(value)
  if (!end) return value?.trim().slice(0, 10) || null
  return end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function AccountSection({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <Card style={styles.section}>
      <AppText style={styles.heading}>{title}</AppText>
      {lead ? <AppText style={styles.lead}>{lead}</AppText> : null}
      {children}
    </Card>
  )
}

function EmailReadonlyField({ email }: { email: string }) {
  return (
    <View style={styles.emailField}>
      <AppText style={styles.fieldLabel}>Email</AppText>
      <AppText style={styles.emailValue}>{email}</AppText>
    </View>
  )
}

function PasswordMaskField() {
  return (
    <View style={styles.passwordMask}>
      <AppText style={styles.passwordLabel}>Password</AppText>
      <AppText style={styles.passwordDots}>••••••••</AppText>
    </View>
  )
}

export default function SettingsAccountScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [email, setEmail] = useState<string | null>(null)
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  useEffect(() => {
    setEmail(getCurrentUserEmail() ?? user?.email ?? null)
  }, [user?.email])

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      void fetchOrgSubscription(true).then((record) => {
        if (!cancelled) setOrg(record)
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  const handleChangePassword = useCallback(async () => {
    setPasswordError(null)
    setPasswordMsg(null)
    if (!newPassword.trim()) {
      setPasswordError('Enter a new password')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordBusy(true)
    const result = await changePassword({
      oldPassword: currentPassword,
      password: newPassword,
      passwordConfirm: confirmPassword,
    })
    setPasswordBusy(false)
    if (!result.ok) {
      setPasswordError(result.error)
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMsg('Password updated')
  }, [confirmPassword, currentPassword, newPassword])

  const handleSendReset = useCallback(async () => {
    if (!email) return
    setResetMsg(null)
    setResetBusy(true)
    const result = await requestPasswordReset(email)
    setResetBusy(false)
    if (!result.ok) {
      setResetMsg(result.error)
      return
    }
    setResetMsg(`Reset link sent to ${email}`)
  }, [email])

  const handleSignOut = useCallback(async () => {
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
      ]
    )
  }, [pendingCount, signOut])

  const passwordReady = Boolean(currentPassword && newPassword && confirmPassword)

  const founding = org ? isFoundingMember(org) : false
  const trialLabel = org ? formatTrialLengthLabel(org, STARTER_TRIAL_DAYS) : null
  const trialing = Boolean(trialLabel)
  const trialEndsLabel = trialing ? formatTrialEndDate(org?.trial_ends_at) : null
  const planKind = resolvePlanBadgeKind(org)
  const planLabel = founding
    ? 'Founding'
    : PLAN_LABELS[org?.plan ?? 'free'] ?? org?.plan ?? FREE_PLAN.name
  const planLead = founding
    ? 'You’re on a founding member plan with lifetime access.'
    : trialing
      ? `Starter free trial · ${STARTER_TRIAL_DAYS} days`
      : `Current plan: ${planLabel}`

  return (
    <SettingsScreen title="Account">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AccountSection title="Plan" lead={planLead}>
          <View style={styles.planRow}>
            <AppText style={styles.planName}>{planLabel}</AppText>
            <PlanBadge kind={planKind} trialing={trialing} />
          </View>
          {trialing && trialLabel ? (
            <AppText variant="caption" style={styles.planMeta}>
              {trialLabel}
            </AppText>
          ) : null}
          {trialing && trialEndsLabel ? (
            <AppText variant="caption" style={styles.planMeta}>
              {`Trial expires ${trialEndsLabel}`}
            </AppText>
          ) : null}
          <ListRow
            title="Billing"
            subtitle="Manage plan and subscription"
            onPress={() => router.push('/settings/billing')}
            grouped
            isLast
          />
        </AccountSection>

        <AccountSection title="Sign-in" lead="Your Rinse login uses email and password.">
          {email ? <EmailReadonlyField email={email} /> : null}
          <PasswordMaskField />
        </AccountSection>

        <AccountSection title="Change password" lead="Enter your current password, then choose a new one.">
          <View style={styles.fields}>
            <FormField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <FormField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <FormField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          {passwordError ? <AppText style={styles.error}>{passwordError}</AppText> : null}
          {passwordMsg ? <AppText style={styles.success}>{passwordMsg}</AppText> : null}
          <SheetSubmitButton
            label="Update password"
            ready={passwordReady}
            done={passwordMsg === 'Password updated'}
            loading={passwordBusy}
            disabled={passwordBusy}
            onPress={() => void handleChangePassword()}
          />
        </AccountSection>

        <AccountSection title="Forgot password?">
          <Text style={styles.lead}>
            {"We'll email a reset link to "}
            <Text style={styles.leadStrong}>{email ?? 'your address'}</Text>
            {". Use it if you can't remember your current password."}
          </Text>
          <SecondaryButton
            label={resetBusy ? 'Sending…' : 'Send reset email'}
            loading={resetBusy}
            onPress={() => void handleSendReset()}
            style={styles.resetBtn}
          />
          {resetMsg ? (
            <AppText style={[styles.resetMsg, resetMsg.startsWith('Reset link sent') ? styles.success : styles.error]}>
              {resetMsg}
            </AppText>
          ) : null}
        </AccountSection>

        <SectionGroup title="Data">
          <ListRow
            title="Access and data"
            subtitle="Backups, export, and delete account"
            onPress={() => router.push('/settings/access')}
          />
        </SectionGroup>

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && !signingOut ? styles.logoutPressed : null]}
        >
          <View>
            <AppText variant="bodyMedium" style={styles.logoutLabel}>
              {signingOut ? 'Signing out…' : 'Log out'}
            </AppText>
          </View>
        </Pressable>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  planName: {
    fontSize: 20,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  planMeta: {
    color: colors.textSecondary,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  lead: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  leadStrong: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  fields: {
    gap: spacing.sm,
  },
  emailField: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.greenText,
  },
  emailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
  },
  passwordMask: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  passwordLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  passwordDots: {
    fontSize: 18,
    letterSpacing: 2,
    color: colors.textMuted,
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
  },
  success: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.greenText,
  },
  resetBtn: {
    marginTop: spacing.xs,
  },
  resetMsg: {
    fontSize: 12,
    lineHeight: 17,
  },
  logoutBtn: {
    marginTop: spacing.sm,
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
