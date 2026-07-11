import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ImagePickerAsset } from 'expo-image-picker'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AccentColorField } from '@/src/components/settings/AccentColorField'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { BusinessLogoSection, logoMetaFromUri, type LogoMeta } from '@/src/components/settings/BusinessLogoSection'
import { SettingsField, SettingsSectionHead } from '@/src/components/settings/SettingsSectionHead'
import { SettingsPanelDivider } from '@/src/components/settings/SettingsToggleRow'
import { WebsiteBookingGuide } from '@/src/components/settings/WebsiteBookingGuide'
import { AppText, Card, PrimaryButton, ScreenLoading } from '@/src/components/ui'
import { SignOutBlockedError } from '@/src/lib/auth'
import { hasCustomBusinessLogo, resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import { bookingPageUrl } from '@/src/lib/booking-embed'
import { appOrigin, loadOrganizationSlug } from '@/src/lib/org-slug'
import {
  clearBusinessLogo,
  loadSettings,
  saveSettings,
  uploadBusinessLogo,
} from '@/src/lib/settings-store'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export default function SettingsBusinessScreen() {
  const { signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null)
  const [logoMeta, setLogoMeta] = useState<LogoMeta | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [accentColor, setAccentColor] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [settings, orgSlug] = await Promise.all([loadSettings(), loadOrganizationSlug()])
    setName(settings.business_name)
    setPhone(settings.business_phone)
    setEmail(settings.business_email)
    setAddress(settings.business_address)
    setAccentColor(settings.accent_color ?? null)
    setLogoUrl(settings.logo_url ?? null)
    setSlug(orgSlug)
    setLogoPreviewUri(null)
    setLogoError(null)

    const src = resolveBusinessLogoSrc(settings.logo_url)
    if (src) {
      void logoMetaFromUri(src).then(setLogoMeta)
    } else {
      setLogoMeta(null)
    }
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const bookingUrl = useMemo(() => {
    if (!slug) return null
    return bookingPageUrl(appOrigin(), slug)
  }, [slug])

  const handleLogoUpload = async (asset: ImagePickerAsset) => {
    setLogoError(null)
    setLogoPreviewUri(asset.uri)
    setLogoUploading(true)
    void logoMetaFromUri(asset.uri).then(setLogoMeta)

    try {
      const saved = await uploadBusinessLogo({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      })
      if (!hasCustomBusinessLogo(saved.logo_url)) {
        throw new Error('Logo was not saved')
      }
      setLogoUrl(saved.logo_url ?? null)
      setLogoPreviewUri(null)
      const src = resolveBusinessLogoSrc(saved.logo_url)
      if (src) void logoMetaFromUri(src).then(setLogoMeta)
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : 'Could not save logo. Check your connection and try again.')
      setLogoPreviewUri(null)
      setLogoMeta(null)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    setRemovingLogo(true)
    try {
      const saved = await clearBusinessLogo()
      setLogoUrl(saved.logo_url ?? null)
      setLogoPreviewUri(null)
      setLogoMeta(null)
    } catch (e) {
      Alert.alert('Remove failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setRemovingLogo(false)
    }
  }

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Business name required', 'Enter your business name before saving.')
      return
    }
    setSaving(true)
    try {
      const saved = await saveSettings({
        business_name: name,
        business_phone: phone,
        business_email: email,
        business_address: address,
        accent_color: accentColor,
      })
      setLogoUrl(saved.logo_url ?? null)
      Alert.alert('Saved', 'Business settings updated.')
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
      <SettingsScreen title="Your business">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Your business">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.panel}>
          <SettingsField>
            <SettingsSectionHead title="Logo" />
            <BusinessLogoSection
              logoUrl={logoUrl}
              previewUri={logoPreviewUri}
              businessName={name}
              logoMeta={logoMeta}
              uploading={logoUploading}
              removing={removingLogo}
              error={logoError}
              onUpload={handleLogoUpload}
              onRemove={handleRemoveLogo}
            />
          </SettingsField>

          <SettingsField>
            <SettingsSectionHead title="Brand accent" />
            <AccentColorField value={accentColor} onChange={setAccentColor} />
          </SettingsField>

          <Card style={styles.formCard}>
            <BusinessFilledField label="Business name" value={name} onChangeText={setName} />
            <SettingsPanelDivider />
            <BusinessFilledField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              optional
            />
            <SettingsPanelDivider />
            <BusinessFilledField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              optional
            />
            <SettingsPanelDivider />
            <BusinessFilledField label="Address" value={address} onChangeText={setAddress} optional multiline />
          </Card>

          <SettingsPanelDivider />

          <SettingsSectionHead
            title="Get booked online"
            description="Works with what you already have — no need to rebuild your site."
          />

          <Card style={styles.bookingCard}>
            {slug && bookingUrl ? (
              <WebsiteBookingGuide
                appOrigin={appOrigin()}
                slug={slug}
                bookingUrl={bookingUrl}
                brandName={name}
              />
            ) : (
              <AppText style={styles.statusLine}>Your booking options will appear after you sign in.</AppText>
            )}
          </Card>
        </Card>

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
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: 0,
  },
  formCard: {
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: 0,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  bookingCard: {
    padding: spacing.md,
    marginBottom: 0,
  },
  statusLine: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
  },
})
