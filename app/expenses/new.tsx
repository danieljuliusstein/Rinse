import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { BusinessExpenseCategory, BusinessExpenseInput, ExpenseLine } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField, AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import {
  createBusinessExpense,
  type ReceiptImageAsset,
} from '@/src/lib/business-expenses-api'
import { todayIso } from '@/src/lib/expense-format'
import { receiptLinesToNotes } from '@/src/lib/receipt-parse'
import { consumeReceiptReviewDraft } from '@/src/lib/receipt-review-draft'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, radii, spacing } from '@/src/theme/colors'

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

export default function NewBusinessExpenseScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ scan?: string; fromReview?: string }>()
  const fromReview = params.fromReview === '1' || params.fromReview === 'true'
  const { bump } = useDataRefresh()
  const [saving, setSaving] = useState(false)
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
  const canSave = name.trim().length > 0 && parsedAmount > 0 && date.length > 0

  const subtitle = useMemo(() => {
    if (fromReview || receiptImage) return 'Photo + details — receipt stays with this expense'
    return 'One-time cost for P&L'
  }, [fromReview, receiptImage])

  const updateLine = (index: number, patch: Partial<ExpenseLine>) => {
    setReceiptLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleSave = async () => {
    if (!canSave || saving) return
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
      router.back()
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
          <SecondaryButton label="Cancel" onPress={() => router.back()} style={styles.footerBtn} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Save'}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={!canSave}
            style={styles.footerBtn}
          />
        </View>
      }
    >
      <View style={styles.body}>
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
          <AppText variant="sectionLabel" style={styles.detailsLabel}>
            Expense details
          </AppText>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. AutoZone supplies" />
          <View style={styles.amountDate}>
            <AffixField
              label="Total"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              style={styles.totalField}
            />
            <FormField
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              style={styles.dateField}
            />
          </View>
          <PillGroup label="Category" options={CATEGORY_PILLS} value={category} onChange={setCategory} />
          <FormField
            label="Vendor"
            value={vendor}
            onChangeText={setVendor}
            placeholder="Store (optional)"
          />
          {!receiptImage ? (
            <FormField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              multiline
            />
          ) : null}
        </View>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
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
    gap: spacing.sm,
  },
  detailsLabel: {
    marginBottom: spacing.xs,
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
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
})
