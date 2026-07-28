import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField, AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { usePremiumGate } from '@/src/hooks/usePremiumGate'
import type { ReceiptImageAsset } from '@/src/lib/business-expenses-api'
import { todayIso } from '@/src/lib/expense-format'
import { receiptLinesToNotes } from '@/src/lib/receipt-parse'
import { consumeReceiptReviewDraft } from '@/src/lib/receipt-review-draft'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const CATEGORY_PILLS: { value: BusinessExpenseCategory; label: string }[] = [
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'legal', label: 'Legal' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
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
  onSave: (input: BusinessExpenseInput, receipt?: ReceiptImageAsset | null) => void
  onDelete?: () => void
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const isEdit = Boolean(expense)
  const { runGated } = usePremiumGate('receipt_ocr')
  const awaitingReview = useRef(false)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('supplies')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptMode, setReceiptMode] = useState(false)
  const [receiptLines, setReceiptLines] = useState<ExpenseLine[]>([{ ...EMPTY_LINE }])
  const [receiptImage, setReceiptImage] = useState<ReceiptImageAsset | null>(null)

  useEffect(() => {
    if (!visible) return
    if (awaitingReview.current) return
    if (expense) {
      setDate(expense.date)
      setName(expense.name)
      setAmount(String(expense.amount))
      setCategory(expense.category ?? 'other')
      setVendor(expense.vendor ?? '')
      setNotes(expense.notes ?? '')
      setReceiptMode(false)
      setReceiptImage(null)
      return
    }
    setDate(todayIso())
    setName('')
    setAmount('')
    setCategory('supplies')
    setVendor('')
    setNotes('')
    setReceiptMode(false)
    setReceiptLines([{ ...EMPTY_LINE }])
    setReceiptImage(null)
  }, [visible, expense])

  useFocusEffect(
    useCallback(() => {
      if (!awaitingReview.current) return
      awaitingReview.current = false
      const draft = consumeReceiptReviewDraft()
      if (!draft) return
      setReceiptMode(true)
      setReceiptImage(draft.image)
      if (draft.merchant) {
        setVendor((v) => v.trim() || draft.merchant!)
        setName((n) => n.trim() || draft.merchant!)
      }
      if (draft.date) setDate(draft.date)
      if (draft.total != null && draft.total > 0) setAmount(String(draft.total))
      if (draft.lines.length) setReceiptLines(draft.lines)
    }, []),
  )

  const parsedAmount = Number(amount) || 0
  const canSave = name.trim().length > 0 && parsedAmount > 0 && date.length > 0

  const openReceiptReview = () => {
    runGated(() => {
      awaitingReview.current = true
      router.push('/expenses/receipt-review?returnTo=sheet')
    })
  }

  const clearReceipt = () => {
    setReceiptMode(false)
    setReceiptImage(null)
    setReceiptLines([{ ...EMPTY_LINE }])
  }

  const updateLine = (index: number, patch: Partial<ExpenseLine>) => {
    setReceiptLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleSave = () => {
    const receiptNotes = receiptMode ? receiptLinesToNotes(receiptLines) : ''
    const mergedNotes = [notes.trim(), receiptNotes].filter(Boolean).join('\n\n')
    onSave(
      {
        date,
        name: name.trim(),
        amount: parsedAmount,
        category,
        vendor: vendor.trim() || undefined,
        notes: mergedNotes || undefined,
      },
      receiptImage,
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>{isEdit ? 'Edit expense' : 'Log business expense'}</AppText>
          <AppText style={styles.subtitle}>
            {receiptMode
              ? 'Receipt image is linked to this expense'
              : 'Dated one-time payment — shows in P&L for that month only'}
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!isEdit ? (
            <Pressable
              accessibilityRole="button"
              onPress={receiptMode ? clearReceipt : openReceiptReview}
              style={[styles.chip, receiptMode ? styles.chipOn : null]}
            >
              <AppText style={[styles.chipLabel, receiptMode ? styles.chipLabelOn : null]}>
                {receiptMode ? 'Clear receipt' : '+ Add receipt'}
              </AppText>
            </Pressable>
          ) : null}

          {!isEdit && receiptMode && receiptImage ? (
            <View style={styles.receiptBlock}>
              <Image
                source={{ uri: receiptImage.uri }}
                style={styles.preview}
                accessibilityLabel="Receipt preview"
              />
              {receiptLines.map((line, index) => (
                <FormRow key={`line-${index}`}>
                  <FormField
                    label="Item"
                    value={line.description}
                    onChangeText={(description) => updateLine(index, { description })}
                    placeholder="What was purchased"
                  />
                  <FormField
                    label="Amount"
                    value={line.amount > 0 ? String(line.amount) : ''}
                    onChangeText={(value) =>
                      updateLine(index, { amount: value === '' ? 0 : Number(value) || 0 })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    style={styles.amountField}
                  />
                </FormRow>
              ))}
            </View>
          ) : null}

          {isEdit && expense?.receipt_url ? (
            <Image
              source={{ uri: expense.receipt_url }}
              style={styles.preview}
              accessibilityLabel="Linked receipt"
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
  receiptBlock: {
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  amountField: {
    flex: 0.55,
  },
  footer: {
    gap: spacing.sm,
  },
})
