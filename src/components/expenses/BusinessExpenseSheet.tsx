import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BusinessExpense, BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@rinse/core'
import { Check, Receipt, X } from '@/src/icons'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField, AppText, PillGroup, SecondaryButton } from '@/src/components/ui'
import { DatePickerSheet } from '@/src/components/ui/DatePickerSheet'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { usePremiumGate } from '@/src/hooks/usePremiumGate'
import type { ReceiptImageAsset } from '@/src/lib/business-expenses-api'
import { todayIso } from '@/src/lib/expense-format'
import { selectionHaptic } from '@/src/lib/haptics'
import { receiptLinesToNotes } from '@/src/lib/receipt-parse'
import { consumeReceiptReviewDraft } from '@/src/lib/receipt-review-draft'
import { colors, radii, spacing, webInlinePressableReset, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const GREEN_SOFT = '#E8F8EE'

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

function formatCardDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
  const [datePickerOpen, setDatePickerOpen] = useState(false)
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
  const amountValid = parsedAmount > 0
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const canSave = name.trim().length > 0 && amountValid && dateValid && Boolean(category)

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
    if (!canSave || saving) return
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
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Receipt size={16} color={colors.greenText} weight="duotone" />
            </View>
            <View style={styles.headerText}>
              <AppText style={styles.title}>{isEdit ? 'Edit expense' : 'Log business expense'}</AppText>
              <AppText style={styles.subtitle}>
                {receiptMode
                  ? 'Receipt image is linked to this expense'
                  : 'One-time cost for P&L'}
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, webInlinePressableReset]}
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.textMuted} weight="bold" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isEdit ? (
            <Pressable
              accessibilityRole="button"
              onPress={receiptMode ? clearReceipt : openReceiptReview}
              style={[styles.chip, receiptMode ? styles.chipOn : null, webInlinePressableReset]}
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

          <AppText variant="sectionLabel">Expense details</AppText>

          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. AutoZone supplies"
          />

          <View style={styles.amountDate}>
            <AffixField
              label="Total"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.totalField}
            />
            <View style={styles.dateWrap}>
              <AppText variant="sectionLabel" style={styles.dateLabel}>
                Date
              </AppText>
              <Pressable
                onPress={() => {
                  selectionHaptic()
                  setDatePickerOpen(true)
                }}
                style={({ pressed }) => [
                  styles.dateCard,
                  dateValid && styles.dateCardOn,
                  webPressableReset,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Date ${formatCardDate(date)}. Tap to change.`}
              >
                <AppText style={styles.dateValue}>{formatCardDate(date)}</AppText>
                {dateValid ? <Check size={16} color={colors.green} weight="bold" /> : null}
              </Pressable>
            </View>
          </View>

          <PillGroup label="Category" options={CATEGORY_PILLS} value={category} onChange={setCategory} />
          <FormField
            label="Vendor (optional)"
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g. AutoZone"
          />
          <FormField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any details…"
            multiline
          />
        </ScrollView>

        <View style={styles.footer}>
          {!canSave ? (
            <AppText style={styles.hint}>Enter a name, amount, and category to save</AppText>
          ) : null}
          {isEdit && onDelete ? <SecondaryButton label="Delete expense" onPress={onDelete} /> : null}
          <View style={styles.footerRow}>
            <SecondaryButton label="Cancel" onPress={onClose} style={styles.footerBtn} />
            <SheetSubmitButton
              label={isEdit ? 'Save changes' : 'Save'}
              ready={canSave}
              loading={saving}
              onPress={handleSave}
              style={styles.footerBtn}
            />
          </View>
        </View>

        <DatePickerSheet
          visible={datePickerOpen}
          title="Expense date"
          value={date}
          minDate="2000-01-01"
          onClose={() => setDatePickerOpen(false)}
          onSelect={(iso) => {
            setDate(iso)
            setDatePickerOpen(false)
          }}
        />
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
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 14,
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
  amountDate: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  totalField: {
    flex: 1,
  },
  dateWrap: {
    flex: 1,
    minWidth: 0,
  },
  dateLabel: {
    marginBottom: 6,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  dateCardOn: {
    borderColor: colors.greenBorder,
    backgroundColor: GREEN_SOFT,
  },
  dateValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.9,
  },
  footer: {
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
})
