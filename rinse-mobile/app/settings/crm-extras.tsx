import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PortalPermissions, ReviewPrefs, SopTemplate, TaxPreset } from '@rinse/core'
import { generatePocketBaseId } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { FormField } from '@/src/components/FormField'
import { AppText, PrimaryButton, ScreenLoading, SecondaryButton } from '@/src/components/ui'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import {
  DEFAULT_PORTAL_PERMISSIONS,
  DEFAULT_REVIEW_PREFS,
  normalizePortalPermissions,
  normalizeReviewPrefs,
  normalizeSopTemplates,
  normalizeTaxPresets,
} from '@/src/lib/wave5-prefs'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsWave5ExtrasScreen() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portal, setPortal] = useState<PortalPermissions>(DEFAULT_PORTAL_PERMISSIONS)
  const [taxPresets, setTaxPresets] = useState<TaxPreset[]>([])
  const [taxName, setTaxName] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [sops, setSops] = useState<SopTemplate[]>([])
  const [sopName, setSopName] = useState('')
  const [sopItems, setSopItems] = useState('')
  const [reviews, setReviews] = useState<ReviewPrefs>(DEFAULT_REVIEW_PREFS)

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    setPortal(normalizePortalPermissions(settings.portal_permissions))
    setTaxPresets(normalizeTaxPresets(settings.tax_presets))
    setSops(normalizeSopTemplates(settings.sop_templates))
    setReviews(normalizeReviewPrefs(settings.review_prefs))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings({
        portal_permissions: portal,
        tax_presets: taxPresets,
        sop_templates: sops,
        review_prefs: reviews,
      })
      Alert.alert(t('crmExtras.saved'), t('crmExtras.savedBody'))
    } catch (e) {
      Alert.alert(t('crmExtras.saveFailed'), e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title={t('crmExtras.title')}>
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title={t('crmExtras.title')} subtitle={t('crmExtras.subtitle')}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText variant="sectionLabel">{t('crmExtras.portalPermissions')}</AppText>
        <SettingsToggleRow
          label={t('crmExtras.payOnline')}
          value={portal.pay}
          onChange={(pay) => setPortal((p) => ({ ...p, pay }))}
        />
        <SettingsToggleRow
          label={t('crmExtras.photos')}
          value={portal.photos}
          onChange={(photos) => setPortal((p) => ({ ...p, photos }))}
        />
        <SettingsToggleRow
          label={t('crmExtras.reschedule')}
          value={portal.reschedule}
          onChange={(reschedule) => setPortal((p) => ({ ...p, reschedule }))}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          {t('crmExtras.taxPresets')}
        </AppText>
        {taxPresets.map((preset, idx) => (
          <AppText key={`${preset.name}-${idx}`} variant="body">
            {preset.name} · {preset.rate}%
          </AppText>
        ))}
        <FormField label={t('crmExtras.presetName')} value={taxName} onChangeText={setTaxName} />
        <FormField label={t('crmExtras.ratePercent')} value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" />
        <SecondaryButton
          label={t('crmExtras.addTaxPreset')}
          onPress={() => {
            const name = taxName.trim()
            const rate = Number(taxRate.replace(/[^0-9.]/g, '')) || 0
            if (!name) return
            setTaxPresets((prev) => [...prev, { name, rate }])
            setTaxName('')
            setTaxRate('0')
          }}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          {t('crmExtras.sopTemplates')}
        </AppText>
        {sops.map((sop) => (
          <AppText key={sop.id} variant="body">
            {sop.name} {t('crmExtras.sopSteps', { count: sop.items.length })}
          </AppText>
        ))}
        <FormField label={t('crmExtras.templateName')} value={sopName} onChangeText={setSopName} />
        <FormField
          label={t('crmExtras.sopItems')}
          value={sopItems}
          onChangeText={setSopItems}
          multiline
        />
        <SecondaryButton
          label={t('crmExtras.addSop')}
          onPress={() => {
            const name = sopName.trim()
            if (!name) return
            const items = sopItems
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
            setSops((prev) => [...prev, { id: generatePocketBaseId(), name, items }])
            setSopName('')
            setSopItems('')
          }}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          {t('crmExtras.businessReviews')}
        </AppText>
        <FormField
          label={t('crmExtras.reviewLink')}
          value={reviews.review_link}
          onChangeText={(review_link) => setReviews((r) => ({ ...r, review_link }))}
        />
        <FormField
          label={t('crmExtras.averageRating')}
          value={String(reviews.review_rating_avg)}
          onChangeText={(text) =>
            setReviews((r) => ({ ...r, review_rating_avg: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
          }
          keyboardType="decimal-pad"
        />
        <FormField
          label={t('crmExtras.reviewCount')}
          value={String(reviews.review_count)}
          onChangeText={(text) =>
            setReviews((r) => ({
              ...r,
              review_count: Math.max(0, Math.floor(Number(text.replace(/[^0-9]/g, '')) || 0)),
            }))
          }
          keyboardType="decimal-pad"
        />

        <PrimaryButton label={t('common.save')} loading={saving} onPress={() => void save()} />
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingBottom: spacing.xl },
  section: { marginTop: spacing.md, color: colors.textMuted },
})
