import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type { TipPrefs } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { FormField } from '@/src/components/FormField'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

export function TipsSheet({
  visible,
  onClose,
  tipPrefs,
  busy,
  onContinue,
}: {
  visible: boolean
  onClose: () => void
  tipPrefs: TipPrefs
  busy?: boolean
  onContinue: (tipPercent: number | null) => void
}) {
  const presets = tipPrefs.presets.length > 0 ? tipPrefs.presets : [15, 18, 20]
  const [enabled, setEnabled] = useState(true)
  const [selected, setSelected] = useState<string>(String(presets[1] ?? presets[0] ?? 18))
  const [custom, setCustom] = useState('')

  useEffect(() => {
    if (!visible) return
    setEnabled(true)
    setSelected(String(presets[1] ?? presets[0] ?? 18))
    setCustom('')
  }, [visible, tipPrefs.presets])

  const options = [
    ...presets.map((p) => ({ value: String(p), label: `${p}%` })),
    { value: 'custom', label: 'Custom' },
  ]

  const tipPercent = !enabled
    ? null
    : selected === 'custom'
      ? Math.max(0, Number(custom.replace(/[^0-9.]/g, '')) || 0)
      : Math.max(0, Number(selected) || 0)

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Suggest a tip?"
      subtitle={tipPrefs.tips_go_to ? `Tips go to ${tipPrefs.tips_go_to}` : 'Optional tip on the pay link'}
      onClose={onClose}
    >
      <PillGroup
        options={[
          { value: 'yes', label: 'Suggest tip' },
          { value: 'no', label: 'Skip' },
        ]}
        value={enabled ? 'yes' : 'no'}
        onChange={(v) => setEnabled(v === 'yes')}
      />
      {enabled ? (
        <>
          <PillGroup options={options} value={selected} onChange={setSelected} />
          {selected === 'custom' ? (
            <FormField
              label="Custom tip %"
              value={custom}
              onChangeText={setCustom}
              keyboardType="decimal-pad"
            />
          ) : null}
        </>
      ) : null}
      <AppText variant="caption" style={styles.hint}>
        Customer will see tip chips on the portal pay screen when this is enabled in settings.
      </AppText>
      <View style={styles.actions}>
        <PrimaryButton
          label="Continue"
          loading={busy}
          onPress={() => onContinue(tipPercent)}
        />
        <SecondaryButton label="Cancel" onPress={onClose} disabled={busy} />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})
