import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@rinse/core'
import { Check, Receipt } from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField, AppText, PillGroup, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { DatePickerSheet } from '@/src/components/ui/DatePickerSheet'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import {
  createBusinessExpense,
  type ReceiptImageAsset,
} from '@/src/lib/business-expenses-api'
import { todayIso } from '@/src/lib/expense-format'
import { selectionHaptic } from '@/src/lib/haptics'
import { receiptLinesToNotes } from '@/src/lib/receipt-parse'
import { consumeReceiptReviewDraft } from '@/src/lib/receipt-review-draft'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, radii, spacing, webPressableReset } from '@/src/theme/colors'
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

export default function NewBusinessExpenseScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ scan?: string; fromReview?: string }>()
  const fromReview = params.fromReview === '1' || params.fromReview === 'true'
  const { bump } = useDataRefresh()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BusinessExpenseCategory>('supplies')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptLines, setReceiptLines] = useState<ExpenseLine[]>([{ ...EMPTY_LINE }])
  const [receiptImage, setReceiptImage] = useState<ReceiptImageAsset | null>(null)
  const [draftApplied, setDraftApplied] = useState(false)

  useEffect(() => {
    if (params.scan === '1' || params.scan === 'true') {
      router.replace('/expenses/receipt-review')
    }
  }, [params.scan, router])

  useEffect(() => {
    const draft = consumeReceiptReviewDraft()
    if (!draft) {
      setDraftApplied(true)
      return
    }
    setReceiptImage(draft.image)
    if (draft.merchant) {
      setVendor(draft.merchant)
      setName(draft.merchant)
    }
    if (draft.date) setDate(draft.date)
    if (draft.total != null && draft.total > 0) setAmount(String(draft.total))
    if (draft.lines.length) setReceiptLines(draft.lines)
    setDraftApplied(true)
  }, [])

  const parsedAmount = Number(amount) || 0
  const amountValid = parsedAmount > 0
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const canSave = name.trim().length > 0 && amountValid && dateValid && Boolean(category)

  const subtitle = useMemo(() => {
    if (fromReview || receiptImage) return 'Photo + details — receipt stays with this expense'
    return 'One-time cost for P&L'
  }, [fromReview, receiptImage])

  const updateLine = (index: number, patch: Partial<ExpenseLine>) => {
    setReceiptLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleSave = async () => {
    if (!canSave || saving || done) return
    setSaving(true)
    try {
      const receiptNotes = receiptLinesToNotes(receiptLines)
      const mergedNotes = [notes.trim(), receiptNotes].filter(Boolean).join('\n\n')
      const input: BusinessExpenseInput = {
        date,
        name: name.trim(),
        amount: parsedAmount,
        category,
        vendor: vendor.trim() || undefined,
        notes: mergedNotes || undefined,
      }
      await createBusinessExpense(input, receiptImage)
      bump()
      setDone(true)
      setTimeout(() => router.back(), 450)
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  if (!draftApplied && (params.scan === '1' || params.scan === 'true')) {
    return null
  }

  return (
    <AppSheet
      title={receiptImage ? 'Log expense' : 'Log business expense'}
      subtitle={subtitle}
      footer={
        <View style={styles.footer}>
          {!canSave && !done ? (
            <AppText style={styles.hint}>Enter a name, amount, and category to save</AppText>
          ) : null}
          <View style={styles.footerRow}>
            <SecondaryButton label="Cancel" onPress={() => router.back()} style={styles.footerBtn} />
            <SheetSubmitButton
              label="Save"
              doneLabel="Saved"
              ready={canSave}
              done={done}
              loading={saving}
              onPress={() => void handleSave()}
              style={styles.footerBtn}
            />
          </View>
        </View>
      }
    >
      <View style={styles.body}>
        {!receiptImage ? (
          <View style={styles.identity}>
            <View style={styles.identityIcon}>
              <Receipt size={16} color={colors.greenText} weight="duotone" />
            </View>
            <AppText style={styles.identityText}>Expense details</AppText>
          </View>
        ) : null}

        {receiptImage ? (
          <View style={styles.receiptBlock}>
            <AppText variant="sectionLabel">Receipt</AppText>
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

        <View style={styles.details}>
          {receiptImage ? (
            <AppText variant="sectionLabel" style={styles.detailsLabel}>
              Expense details
            </AppText>
          ) : null}

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
            <View style={styles.dateField}>
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

          {!receiptImage ? (
            <FormField
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any details…"
              multiline
            />
          ) : null}
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
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  receiptBlock: {
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceActive,
  },
  amountField: {
    flex: 0.55,
  },
  details: {
    gap: 14,
  },
  detailsLabel: {
    marginBottom: 0,
  },
  amountDate: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  totalField: {
    flex: 1,
  },
  dateField: {
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
