import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { BusinessExpenseCategory, BusinessExpenseInput } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AffixField, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { createBusinessExpense } from '@/src/lib/business-expenses-api'
import { todayIso } from '@/src/lib/expense-format'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { spacing } from '@/src/theme/colors'

const CATEGORY_PILLS: { value: BusinessExpenseCategory; label: string }[] = [
  { value: 'legal', label: 'Legal' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
]

export default function NewBusinessExpenseScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('legal')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')

  const parsedAmount = Number(amount) || 0
  const canSave = name.trim().length > 0 && parsedAmount > 0 && date.length > 0

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const input: BusinessExpenseInput = {
        date,
        name: name.trim(),
        amount: parsedAmount,
        category,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      await createBusinessExpense(input)
      bump()
      router.back()
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppSheet
      title="Log business expense"
      subtitle="One-time payment — shows in P&L for that month"
      footer={
        <View style={styles.footer}>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Log expense'}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={!canSave}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <AffixField
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <FormField label="Name" value={name} onChangeText={setName} placeholder="Expense name" />
        <PillGroup label="Category" options={CATEGORY_PILLS} value={category} onChange={setCategory} />
        <FormField
          label="Vendor (optional)"
          value={vendor}
          onChangeText={setVendor}
          placeholder="Store or provider"
        />
        <FormField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Receipt details…"
          multiline
        />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
})
