import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Code, Copy } from 'phosphor-react-native'
import { AppText, Button, Card } from '@/src/components/ui'
import { embedCalendarScriptHtml } from '@/src/lib/booking-embed'
import { appOrigin, loadOrganizationSlug } from '@/src/lib/org-slug'
import { loadSettings } from '@/src/lib/settings-store'
import { copyTextToClipboard } from '@/src/lib/share'
import { colors, iconTonePalette, radii, spacing } from '@/src/theme/colors'

export function WebsiteWidgetCard() {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    void Promise.all([loadOrganizationSlug(), loadSettings()]).then(([s, settings]) => {
      setSlug(s)
      setBusinessName(settings.business_name)
    })
  }, [])

  const snippet = useMemo(() => {
    if (!slug) return null
    return embedCalendarScriptHtml(appOrigin(), slug, businessName)
  }, [slug, businessName])

  const handleCopy = async () => {
    if (!snippet) return
    await copyTextToClipboard(snippet, 'Embed code copied.')
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Code size={22} color={colors.greenText} weight="duotone" />
        </View>
        <View style={styles.copy}>
          <AppText variant="bodySemiBold">Website booking widget</AppText>
          <AppText variant="caption" style={styles.sub}>
            Embed your calendar on any site — clients book without leaving your brand.
          </AppText>
        </View>
      </View>
      {snippet ? (
        <AppText variant="caption" style={styles.code} selectable>
          {snippet}
        </AppText>
      ) : (
        <AppText variant="caption" style={styles.hint}>
          Set up your booking link in Settings → Your business first.
        </AppText>
      )}
      <View style={styles.actions}>
        {snippet ? (
          <Pressable style={styles.copyBtn} onPress={() => void handleCopy()}>
            <Copy size={16} color={colors.textPrimary} />
            <AppText variant="bodySemiBold">Copy embed code</AppText>
          </Pressable>
        ) : null}
        <Button variant="ghost" label="Open booking settings" onPress={() => router.push('/settings/business')} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.icon,
    backgroundColor: iconTonePalette.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  sub: {
    color: colors.textSecondary,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceActive,
    padding: 10,
    borderRadius: radii.md,
  },
  hint: {
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
})
