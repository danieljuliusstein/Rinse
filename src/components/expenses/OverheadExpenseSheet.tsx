import { useEffect, useState } from 'react'
import { Modal, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BillingCycle, OverheadCategory } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AffixField, AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const CATEGORIES: { value: OverheadCategory; label: string }[] = [
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'one_time', label: 'One-time' },
]

export function OverheadExpenseSheet({
  visible,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean
  saving: boolean
  onClose: () => void
  onSave: (input: {
    name: string
    amount: number
    category: OverheadCategory
    billing_cycle: BillingCycle
  }) => void
}) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<OverheadCategory>('other')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  useEffect(() => {
    if (!visible) return
    setName('')
    setAmount('')
    setCategory('other')
    setCycle('monthly')
  }, [visible])

  const parsedAmount = Number(amount) || 0
  const canSave = name.trim().length > 0 && parsedAmount > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>New expense</AppText>
          <AppText style={styles.subtitle}>Recurring overhead — rent, insurance, subscriptions</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <FormField label="Name" value={name} onChangeText={setName} placeholder="Insurance, software…" />
          <AffixField label="Amount" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
          <PillGroup label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
          <PillGroup label="Billing cycle" options={CYCLES} value={cycle} onChange={setCycle} />
        </ScrollView>

        <View style={styles.footer}>
          <SecondaryButton label="Cancel" onPress={onClose} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Add expense'}
            onPress={() =>
              onSave({
                name: name.trim(),
                amount: parsedAmount,
                category,
                billing_cycle: cycle,
              })
            }
            loading={saving}
            disabled={!canSave}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  footer: {
    gap: spacing.sm,
  },
})
