import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
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
      Alert.alert('Saved', 'Portal, tax, SOP, and reviews updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="CRM extras">
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="CRM extras" subtitle="Portal, tax, SOP, reviews">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText variant="sectionLabel">Portal permissions</AppText>
        <SettingsToggleRow
          label="Pay online"
          value={portal.pay}
          onChange={(pay) => setPortal((p) => ({ ...p, pay }))}
        />
        <SettingsToggleRow
          label="Photos"
          value={portal.photos}
          onChange={(photos) => setPortal((p) => ({ ...p, photos }))}
        />
        <SettingsToggleRow
          label="Reschedule request"
          value={portal.reschedule}
          onChange={(reschedule) => setPortal((p) => ({ ...p, reschedule }))}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          Tax presets
        </AppText>
        {taxPresets.map((preset, idx) => (
          <AppText key={`${preset.name}-${idx}`} variant="body">
            {preset.name} · {preset.rate}%
          </AppText>
        ))}
        <FormField label="Preset name" value={taxName} onChangeText={setTaxName} />
        <FormField label="Rate %" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" />
        <SecondaryButton
          label="Add tax preset"
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
          SOP templates
        </AppText>
        {sops.map((sop) => (
          <AppText key={sop.id} variant="body">
            {sop.name} ({sop.items.length} steps)
          </AppText>
        ))}
        <FormField label="Template name" value={sopName} onChangeText={setSopName} />
        <FormField
          label="Items (one per line)"
          value={sopItems}
          onChangeText={setSopItems}
          multiline
        />
        <SecondaryButton
          label="Add SOP"
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
          Business reviews
        </AppText>
        <FormField
          label="Review link"
          value={reviews.review_link}
          onChangeText={(review_link) => setReviews((r) => ({ ...r, review_link }))}
        />
        <FormField
          label="Average rating"
          value={String(reviews.review_rating_avg)}
          onChangeText={(text) =>
            setReviews((r) => ({ ...r, review_rating_avg: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
          }
          keyboardType="decimal-pad"
        />
        <FormField
          label="Review count"
          value={String(reviews.review_count)}
          onChangeText={(text) =>
            setReviews((r) => ({
              ...r,
              review_count: Math.max(0, Math.floor(Number(text.replace(/[^0-9]/g, '')) || 0)),
            }))
          }
          keyboardType="decimal-pad"
        />

        <PrimaryButton label="Save" loading={saving} onPress={() => void save()} />
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingBottom: spacing.xl },
  section: { marginTop: spacing.md, color: colors.textMuted },
})
