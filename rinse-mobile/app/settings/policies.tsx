import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PillGroup, PrimaryButton, ScreenLoading } from '@/src/components/ui'
import { FormField } from '@/src/components/FormField'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import {
  DEFAULT_BUSINESS_POLICIES,
  DEFAULT_TIP_PREFS,
  normalizeBusinessPolicies,
  normalizeTipPrefs,
} from '@/src/lib/wave5-prefs'
import type { BusinessPolicies, TipPrefs } from '@rinse/core'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsPoliciesScreen() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [policies, setPolicies] = useState<BusinessPolicies>(DEFAULT_BUSINESS_POLICIES)
  const [tips, setTips] = useState<TipPrefs>({ ...DEFAULT_TIP_PREFS, presets: [...DEFAULT_TIP_PREFS.presets] })

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    setPolicies(normalizeBusinessPolicies(settings.business_policies))
    setTips(normalizeTipPrefs(settings.tip_prefs))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings({
        business_policies: normalizeBusinessPolicies(policies),
        tip_prefs: normalizeTipPrefs(tips),
        deposit_required: policies.collect_at_booking,
        default_deposit_amount: policies.deposit_mode === 'fixed' ? policies.deposit_value : 0,
      })
      Alert.alert(t('policies.saved'), t('policies.savedBody'))
    } catch (e) {
      Alert.alert(t('policies.saveFailed'), e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title={t('policies.title')}>
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title={t('policies.title')} subtitle={t('policies.subtitle')}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="sectionLabel" style={styles.section}>
          {t('policies.deposit')}
        </AppText>
        <PillGroup
          options={[
            { value: 'percent', label: t('policies.percent') },
            { value: 'fixed', label: t('policies.fixed') },
          ]}
          value={policies.deposit_mode}
          onChange={(deposit_mode) => setPolicies((p) => ({ ...p, deposit_mode }))}
        />
        {policies.deposit_mode === 'fixed' ? (
          <AffixField
            label={t('policies.depositAmount')}
            value={String(policies.deposit_value)}
            onChangeText={(text) =>
              setPolicies((p) => ({ ...p, deposit_value: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
            }
            keyboardType="decimal-pad"
          />
        ) : (
          <FormField
            label={t('policies.depositPercent')}
            value={String(policies.deposit_value)}
            onChangeText={(text) =>
              setPolicies((p) => ({ ...p, deposit_value: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
            }
            keyboardType="decimal-pad"
          />
        )}
        <SettingsToggleRow
          label={t('policies.collectAtBooking')}
          value={policies.collect_at_booking}
          onChange={(collect_at_booking) => setPolicies((p) => ({ ...p, collect_at_booking }))}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          {t('policies.cancelSection')}
        </AppText>
        <FormField
          label={t('policies.cancelWindow')}
          value={String(policies.cancel_window_hours)}
          onChangeText={(text) =>
            setPolicies((p) => ({
              ...p,
              cancel_window_hours: Math.max(0, Math.floor(Number(text.replace(/[^0-9]/g, '')) || 0)),
            }))
          }
          keyboardType="decimal-pad"
        />
        <AffixField
          label={t('policies.noShowFee')}
          value={String(policies.no_show_fee)}
          onChangeText={(text) =>
            setPolicies((p) => ({ ...p, no_show_fee: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
          }
          keyboardType="decimal-pad"
        />
        <FormField
          label={t('policies.noShowFeeCopy')}
          value={policies.no_show_fee_copy}
          onChangeText={(no_show_fee_copy) => setPolicies((p) => ({ ...p, no_show_fee_copy }))}
          placeholder={t('policies.noShowPlaceholder')}
          multiline
        />

        <AppText variant="sectionLabel" style={styles.section}>
          {t('policies.tipsSection')}
        </AppText>
        <SettingsToggleRow
          label={t('policies.suggestTip')}
          value={tips.suggest_on_pay_link}
          onChange={(suggest_on_pay_link) => setTips((t) => ({ ...t, suggest_on_pay_link }))}
        />
        <FormField
          label={t('policies.tipsGoTo')}
          value={tips.tips_go_to}
          onChangeText={(tips_go_to) => setTips((t) => ({ ...t, tips_go_to }))}
          placeholder={t('policies.tipsGoToPlaceholder')}
        />

        <View style={styles.footer}>
          <PrimaryButton label={t('common.save')} loading={saving} onPress={() => void save()} />
        </View>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  footer: {
    marginTop: spacing.lg,
  },
})
