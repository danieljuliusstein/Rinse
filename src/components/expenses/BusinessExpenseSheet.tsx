import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { ReceiptLineItemsEditor } from '@/src/components/expenses/ReceiptLineItemsEditor'
import { AffixField, AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { usePremiumGate } from '@/src/hooks/usePremiumGate'
import { todayIso } from '@/src/lib/expense-format'
import { receiptLinesToNotes } from '@/src/lib/receipt-parse'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

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

const EMPTY_LINE: ExpenseLine = { category: 'supplies', description: '', amount: 0 }

export function BusinessExpenseSheet({
  visible,
  saving,
  expense,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean
  saving: boolean
  expense: BusinessExpense | null
  onClose: () => void
  onSave: (input: BusinessExpenseInput) => void
  onDelete?: () => void
}) {
  const insets = useSafeAreaInsets()
  const isEdit = Boolean(expense)
  const { runGated } = usePremiumGate('receipt_ocr')
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('legal')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptMode, setReceiptMode] = useState(false)
  const [receiptLines, setReceiptLines] = useState<ExpenseLine[]>([{ ...EMPTY_LINE }])

  useEffect(() => {
    if (!visible) return
    if (expense) {
      setDate(expense.date)
      setName(expense.name)
      setAmount(String(expense.amount))
      setCategory(expense.category ?? 'other')
      setVendor(expense.vendor ?? '')
      setNotes(expense.notes ?? '')
      setReceiptMode(false)
      return
    }
    setDate(todayIso())
    setName('')
    setAmount('')
    setCategory('legal')
    setVendor('')
    setNotes('')
    setReceiptMode(false)
    setReceiptLines([{ ...EMPTY_LINE }])
  }, [visible, expense])

  const parsedAmount = Number(amount) || 0
  const canSave = name.trim().length > 0 && parsedAmount > 0 && date.length > 0

  const toggleReceiptMode = () => {
    if (receiptMode) {
      setReceiptMode(false)
      return
    }
    runGated(() => setReceiptMode(true))
  }

  const handleSave = () => {
    const receiptNotes = receiptMode ? receiptLinesToNotes(receiptLines) : ''
    const mergedNotes = [notes.trim(), receiptNotes].filter(Boolean).join('\n\n')
    onSave({
      date,
      name: name.trim(),
      amount: parsedAmount,
      category,
      vendor: vendor.trim() || undefined,
      notes: mergedNotes || undefined,
    })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>{isEdit ? 'Edit expense' : 'Log business expense'}</AppText>
          <AppText style={styles.subtitle}>Dated one-time payment — shows in P&L for that month only</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!isEdit ? (
            <Pressable
              accessibilityRole="button"
              onPress={toggleReceiptMode}
              style={[styles.chip, receiptMode ? styles.chipOn : null]}
            >
              <AppText style={[styles.chipLabel, receiptMode ? styles.chipLabelOn : null]}>
                {receiptMode ? 'Receipt scan on' : 'Scan receipt (line items)'}
              </AppText>
            </Pressable>
          ) : null}

          {!isEdit && receiptMode ? (
            <ReceiptLineItemsEditor
              lines={receiptLines}
              onChange={setReceiptLines}
              onTotalChange={(total) => setAmount(total > 0 ? String(total) : '')}
              onMerchantChange={(merchant) => {
                if (!vendor.trim()) setVendor(merchant)
                if (!name.trim()) setName(merchant)
              }}
              onDateChange={setDate}
            />
          ) : null}

          <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <AffixField label="Amount" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
          <FormField label="Name" value={name} onChangeText={setName} placeholder="Expense name" />
          <PillGroup label="Category" options={CATEGORY_PILLS} value={category} onChange={setCategory} />
          <FormField label="Vendor (optional)" value={vendor} onChangeText={setVendor} placeholder="Store or provider" />
          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Receipt details…" multiline />
        </ScrollView>

        <View style={styles.footer}>
          {isEdit && onDelete ? <SecondaryButton label="Delete expense" onPress={onDelete} /> : null}
          <SecondaryButton label="Cancel" onPress={onClose} />
          <PrimaryButton
            label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log expense'}
            onPress={handleSave}
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
    fontFamily: fonts.displayBold,
    fontSize: 22,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  chipLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  chipLabelOn: {
    color: colors.greenText,
  },
  footer: {
    gap: spacing.sm,
  },
})
