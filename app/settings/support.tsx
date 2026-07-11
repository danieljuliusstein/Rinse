import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { EnvelopeSimple } from 'phosphor-react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, Button, Card, ListRow, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { SignOutBlockedError } from '@/src/lib/auth'
import { appOrigin, loadOrganizationSlug } from '@/src/lib/org-slug'
import { dispatchTourReplayEvent, requestTourReplay } from '@/src/lib/product-tour-replay'
import { loadSettings } from '@/src/lib/settings-store'
import { LEGAL_URLS, copyTextToClipboard } from '@/src/lib/share'
import {
  APP_DISPLAY_NAME,
  buildBugReportMailto,
  buildContactMailto,
  buildDebugInfo,
  getAppVersion,
  getSupportBackendLabel,
  getSupportEmail,
  getSupportUserAgent,
} from '@/src/lib/support-config'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const FAQ_LINKS = [
  { href: '/settings/faq?focus=pipeline', label: 'Lead pipeline' },
  { href: '/settings/faq?focus=online-payments', label: 'Online payments (Stripe)' },
  { href: '/settings/faq?focus=schedule', label: 'Booking schedule & time off' },
  { href: '/settings/faq?focus=auto-messages', label: 'Auto messages' },
  { href: '/settings/faq', label: 'All FAQ' },
  { href: LEGAL_URLS.terms, label: 'Terms of service', external: true },
  { href: '/settings/privacy', label: 'Privacy policy' },
] as const

export default function SettingsSupportScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const supportEmail = getSupportEmail()
  const contactMailto = buildContactMailto()

  const refresh = useCallback(async () => {
    const [settings, slug] = await Promise.all([loadSettings(), loadOrganizationSlug()])
    setBusinessName(settings.business_name?.trim() || null)
    setOrgSlug(slug)
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const debugInfo = useMemo(
    () =>
      buildDebugInfo({
        backend: getSupportBackendLabel(),
        origin: appOrigin(),
        userAgent: getSupportUserAgent(),
        timestamp: new Date().toISOString(),
        orgSlug,
        businessName,
      }),
    [orgSlug, businessName],
  )

  const bugMailto = buildBugReportMailto(debugInfo)

  const handleCopyDebug = async () => {
    setCopyMsg(null)
    try {
      await copyTextToClipboard(debugInfo, 'Debug info copied.')
      setCopyMsg('Copied — paste into your support email')
    } catch {
      setCopyMsg('Could not copy — select and copy the text manually')
    }
  }

  const handleReplayTour = async () => {
    await requestTourReplay()
    dispatchTourReplayEvent()
    Alert.alert('App tour', 'Return to the home screen to replay the tour.')
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
      <SettingsScreen title="Help & support">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Help & support">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.contactCard}>
          <AppText variant="bodySemiBold" style={styles.cardTitle}>
            Contact us
          </AppText>
          <AppText variant="body" style={styles.cardLead}>
            Questions, bugs, or account help — we're here for you.
          </AppText>
          <AppText variant="caption" style={styles.cardHint}>
            We typically reply within 1 business day.
          </AppText>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.emailBtn, pressed ? styles.emailBtnPressed : null]}
            onPress={() => void Linking.openURL(contactMailto)}
          >
            <EnvelopeSimple size={18} color={colors.textPrimary} weight="bold" />
            <AppText variant="bodySemiBold">Email support</AppText>
          </Pressable>
          <AppText variant="caption" style={styles.emailMeta}>
            {supportEmail}
          </AppText>
        </Card>

        <SectionGroup title="Help topics">
          <ListRow title="Replay app tour" onPress={() => void handleReplayTour()} />
          {FAQ_LINKS.map((link) => (
            <ListRow
              key={link.label}
              title={link.label}
              onPress={() => {
                if ('external' in link && link.external) {
                  void Linking.openURL(link.href)
                  return
                }
                router.push(link.href as never)
              }}
            />
          ))}
        </SectionGroup>

        <Card style={styles.bugCard}>
          <AppText variant="bodySemiBold" style={styles.cardTitle}>
            Report a bug
          </AppText>
          <AppText variant="body" style={styles.cardLead}>
            Copy debug info and send it with a short description of what went wrong.
          </AppText>
          <View style={styles.bugActions}>
            <Button variant="ghost" label="Copy debug info" onPress={() => void handleCopyDebug()} />
            <Button
              variant="ghost"
              label="Email support with debug info"
              onPress={() => void Linking.openURL(bugMailto)}
            />
          </View>
          {copyMsg ? (
            <AppText variant="caption" style={styles.copyMsg}>
              {copyMsg}
            </AppText>
          ) : null}
          <AppText variant="caption" style={styles.debugPreview} selectable accessibilityLabel="Debug info preview">
            {debugInfo}
          </AppText>
        </Card>

        <AppText variant="caption" style={styles.meta}>
          {APP_DISPLAY_NAME} · v{getAppVersion()}
        </AppText>

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && !signingOut ? styles.logoutPressed : null]}
        >
          <Text style={styles.logoutLabel}>{signingOut ? 'Signing out…' : 'Log out'}</Text>
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
  contactCard: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  bugCard: {
    gap: spacing.sm,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 15,
  },
  cardLead: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  cardHint: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emailBtnPressed: {
    opacity: 0.9,
  },
  emailMeta: {
    textAlign: 'center',
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  bugActions: {
    gap: spacing.xs,
  },
  copyMsg: {
    color: colors.textSecondary,
  },
  debugPreview: {
    marginTop: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceActive,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    fontFamily: 'Courier',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textDim,
    maxHeight: 160,
  },
  meta: {
    textAlign: 'center',
    color: colors.textDim,
    fontSize: 11,
    marginTop: spacing.xs,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
})
