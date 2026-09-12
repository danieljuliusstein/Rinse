import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
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
      })
      Alert.alert('Saved', 'Deposit, cancel, and tip policies updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="Policies">
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Policies" subtitle="Deposits, cancel window, tips">
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="sectionLabel" style={styles.section}>
          Deposit
        </AppText>
        <PillGroup
          options={[
            { value: 'percent', label: 'Percent' },
            { value: 'fixed', label: 'Fixed $' },
          ]}
          value={policies.deposit_mode}
          onChange={(deposit_mode) => setPolicies((p) => ({ ...p, deposit_mode }))}
        />
        {policies.deposit_mode === 'fixed' ? (
          <AffixField
            label="Deposit amount"
            value={String(policies.deposit_value)}
            onChangeText={(text) =>
              setPolicies((p) => ({ ...p, deposit_value: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
            }
            keyboardType="decimal-pad"
          />
        ) : (
          <FormField
            label="Deposit %"
            value={String(policies.deposit_value)}
            onChangeText={(text) =>
              setPolicies((p) => ({ ...p, deposit_value: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
            }
            keyboardType="decimal-pad"
          />
        )}
        <SettingsToggleRow
          label="Collect at booking"
          value={policies.collect_at_booking}
          onChange={(collect_at_booking) => setPolicies((p) => ({ ...p, collect_at_booking }))}
        />

        <AppText variant="sectionLabel" style={styles.section}>
          Cancel / no-show
        </AppText>
        <FormField
          label="Cancel window (hours)"
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
          label="No-show fee"
          value={String(policies.no_show_fee)}
          onChangeText={(text) =>
            setPolicies((p) => ({ ...p, no_show_fee: Number(text.replace(/[^0-9.]/g, '')) || 0 }))
          }
          keyboardType="decimal-pad"
        />
        <FormField
          label="No-show fee copy"
          value={policies.no_show_fee_copy}
          onChangeText={(no_show_fee_copy) => setPolicies((p) => ({ ...p, no_show_fee_copy }))}
          placeholder="Charged if client misses the appointment"
          multiline
        />

        <AppText variant="sectionLabel" style={styles.section}>
          Tips on pay link
        </AppText>
        <SettingsToggleRow
          label="Suggest tip on pay link"
          value={tips.suggest_on_pay_link}
          onChange={(suggest_on_pay_link) => setTips((t) => ({ ...t, suggest_on_pay_link }))}
        />
        <FormField
          label="Tips go to"
          value={tips.tips_go_to}
          onChangeText={(tips_go_to) => setTips((t) => ({ ...t, tips_go_to }))}
          placeholder="Tech name or business"
        />

        <View style={styles.footer}>
          <PrimaryButton label="Save" loading={saving} onPress={() => void save()} />
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
