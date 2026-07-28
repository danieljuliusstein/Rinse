import { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { AppText, ListRow, SectionGroup } from '@/src/components/ui'
import { listInvoices } from '@/src/lib/invoices-api'
import { computeArSummary } from '@/src/lib/ar-metrics'
import {
  buildPrimaryHubSections,
  filterHubSections,
  invoicesHubSubtitle,
  reviewHubSubtitle,
  settingsMenuAsHubSections,
} from '@/src/lib/business-hub'
import { searchSettingsMenu } from '@/src/lib/settings-menu'
import { loadSettings } from '@/src/lib/settings-store'
import { billingMenuSubtitle } from '@/src/lib/subscription-types'
import { STARTER_TRIAL_DAYS } from '@/src/lib/plans'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { normalizeReviewPrefs } from '@/src/lib/wave5-prefs'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

export default function BusinessHubScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const { org } = useOrgSubscription()
  const [query, setQuery] = useState('')
  const [reviewSubtitle, setReviewSubtitle] = useState('Set rating & link')
  const [invoicesSubtitle, setInvoicesSubtitle] = useState('Open balances')

  const billingSubtitle = billingMenuSubtitle(org, STARTER_TRIAL_DAYS)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      void (async () => {
        try {
          const [settings, invoices] = await Promise.all([loadSettings(), listInvoices()])
          if (cancelled) return
          const prefs = normalizeReviewPrefs(settings.review_prefs)
          setReviewSubtitle(reviewHubSubtitle(prefs.review_rating_avg, prefs.review_count))
          const ar = computeArSummary(invoices)
          setInvoicesSubtitle(invoicesHubSubtitle(ar.unpaid, ar.openCount))
        } catch {
          if (!cancelled) {
            setReviewSubtitle('Set rating & link')
            setInvoicesSubtitle('Open balances')
          }
        }
      })()
      return () => {
        cancelled = true
      }
    }, []),
  )

  const sections = useMemo(() => {
    void i18n.language
    const primary = buildPrimaryHubSections({ reviewSubtitle, invoicesSubtitle })
    const settingsItems = searchSettingsMenu('').map((item) => ({
      ...item,
      title: t(item.titleKey),
      subtitle: item.id === 'billing' ? billingSubtitle : t(item.subtitleKey),
    }))
    const groupLabels: Record<string, string> = {
      account: t('settings.groups.account'),
      business: t('settings.groups.business'),
      preferences: t('settings.groups.preferences'),
      management: t('settings.groups.management'),
      support: t('settings.groups.support'),
    }
    const settingsSections = settingsMenuAsHubSections(settingsItems, groupLabels)
    return filterHubSections([...primary, ...settingsSections], query)
  }, [query, reviewSubtitle, invoicesSubtitle, billingSubtitle, t, i18n.language])

  const navigate = (href: string) => {
    if (href === '/inventory') {
      router.push('/(tabs)/inventory')
      return
    }
    if (href === '/invoices') {
      router.push('/(tabs)/invoices')
      return
    }
    if (href === '/tools') {
      router.push('/(tabs)/tools')
      return
    }
    router.push(href as never)
  }

  return (
    <OperatorScreen title={t('business.title')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('settings.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {sections.map((section) => (
          <SectionGroup key={section.id} title={section.label}>
            {section.rows.map((row) => {
              const Icon = row.Icon
              const tone = iconTonePalette[row.tone]
              return (
                <ListRow
                  key={`${section.id}-${row.id}`}
                  icon={<Icon size={18} color={tone.fg} weight="duotone" />}
                  iconTone={row.tone}
                  title={row.title}
                  subtitle={row.subtitle}
                  onPress={() => navigate(row.href)}
                />
              )
            })}
          </SectionGroup>
        ))}

        {sections.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="body" style={{ color: colors.textMuted }}>
              No matches
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
})
