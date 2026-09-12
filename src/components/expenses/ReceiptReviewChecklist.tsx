import { Image, Pressable, StyleSheet, View } from 'react-native'
import { Check, Plus, Trash } from '@/src/icons'
import type { ReceiptHeuristicLine } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField, AppText, PrimaryButton } from '@/src/components/ui'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function ReceiptReviewChecklist({
  previewUri,
  merchant,
  date,
  total,
  lines,
  manualMessage,
  onMerchantChange,
  onDateChange,
  onTotalChange,
  onLinesChange,
  onContinue,
  continueDisabled,
}: {
  previewUri: string
  merchant: string
  date: string
  total: string
  lines: ReceiptHeuristicLine[]
  manualMessage?: string | null
  onMerchantChange: (v: string) => void
  onDateChange: (v: string) => void
  onTotalChange: (v: string) => void
  onLinesChange: (lines: ReceiptHeuristicLine[]) => void
  onContinue: () => void
  continueDisabled?: boolean
}) {
  const toggle = (index: number) => {
    onLinesChange(lines.map((line, i) => (i === index ? { ...line, included: !line.included } : line)))
  }

  const updateLine = (index: number, patch: Partial<ReceiptHeuristicLine>) => {
    onLinesChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const addLine = () => {
    onLinesChange([...lines, { text: '', amount: undefined, included: true }])
  }

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index))
  }

  return (
    <View style={styles.root}>
      <AppText variant="sectionLabel">Review receipt</AppText>
      <Image source={{ uri: previewUri }} style={styles.preview} accessibilityLabel="Receipt preview" />

      <FormField label="Merchant" value={merchant} onChangeText={onMerchantChange} placeholder="Store name" />
      <View style={styles.row2}>
        <FormField
          label="Date"
          value={date}
          onChangeText={onDateChange}
          placeholder="YYYY-MM-DD"
          style={styles.half}
        />
        <AffixField
          label="Total"
          value={total}
          onChangeText={onTotalChange}
          placeholder="0"
          keyboardType="decimal-pad"
          style={styles.half}
        />
      </View>

      {manualMessage ? (
        <AppText variant="caption" style={styles.manual} accessibilityRole="alert">
          {manualMessage}
        </AppText>
      ) : null}

      <AppText variant="sectionLabel" style={styles.linesLabel}>
        OCR lines
      </AppText>

      {lines.map((line, index) => (
        <View key={`ocr-line-${index}`} style={styles.lineRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: line.included }}
            accessibilityLabel={line.included ? 'Exclude line' : 'Include line'}
            onPress={() => toggle(index)}
            style={[styles.check, line.included ? styles.checkOn : null]}
          >
            {line.included ? <Check size={14} color="#fff" weight="bold" /> : null}
          </Pressable>
          <View style={styles.lineFields}>
            <FormRow>
              <FormField
                label="Item"
                value={line.text}
                onChangeText={(text) => updateLine(index, { text })}
                placeholder="Description"
              />
              <FormField
                label="Amount"
                value={line.amount != null && line.amount > 0 ? String(line.amount) : ''}
                onChangeText={(value) =>
                  updateLine(index, { amount: value === '' ? undefined : Number(value) || 0 })
                }
                keyboardType="decimal-pad"
                placeholder="0"
                style={styles.amountField}
              />
            </FormRow>
          </View>
          {lines.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove line"
              onPress={() => removeLine(index)}
              style={styles.removeBtn}
            >
              <Trash size={18} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ))}

      <Pressable accessibilityRole="button" onPress={addLine} style={styles.addRow}>
        <Plus size={16} color={colors.greenText} weight="bold" />
        <AppText style={styles.addLabel}>Add line</AppText>
      </Pressable>

      <PrimaryButton label="Continue" onPress={onContinue} disabled={continueDisabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  preview: {
    width: '100%',
    height: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceActive,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  half: {
    flex: 1,
  },
  manual: {
    color: colors.textSecondary,
  },
  linesLabel: {
    marginBottom: 0,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  lineFields: {
    flex: 1,
    minWidth: 0,
  },
  amountField: {
    flex: 0.55,
  },
  removeBtn: {
    marginTop: 28,
    padding: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addLabel: {
    color: colors.greenText,
    fontFamily: fonts.bodyMedium,
  },
})
