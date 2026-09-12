import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import {
  lineAmount,
  normalizeBillingLine,
  type InvoiceLineTemplate,
} from '@rinse/core'
import { Minus, Plus, X } from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { colors, radii, shadows, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

/** Compact Bolt-style qty × rate row — keeps real billing line shape for createQuote. */
export function QuoteExtraLineEditor({
  line,
  onChange,
  onRemove,
}: {
  line: InvoiceLineTemplate
  onChange: (next: InvoiceLineTemplate) => void
  onRemove?: () => void
}) {
  const normalized = normalizeBillingLine(line)
  const qty = Math.max(1, normalized.quantity ?? 1)
  const rate = normalized.unit_price ?? 0

  const patch = (partial: Partial<InvoiceLineTemplate>) => {
    onChange(
      normalizeBillingLine({
        ...normalized,
        unit: normalized.unit ?? 'each',
        ...partial,
      }),
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TextInput
          style={styles.desc}
          value={normalized.description}
          onChangeText={(description) => patch({ description })}
          placeholder="Line description"
          placeholderTextColor={colors.textDim}
        />
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={[styles.removeBtn, webInlinePressableReset]}
            accessibilityRole="button"
            accessibilityLabel="Remove line"
            hitSlop={8}
          >
            <X size={15} color={colors.textDim} weight="bold" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => patch({ quantity: Math.max(1, qty - 1) })}
            style={[styles.stepBtn, webInlinePressableReset]}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Minus size={14} color={colors.textMuted} weight="bold" />
          </Pressable>
          <AppText style={styles.qty}>{qty}</AppText>
          <Pressable
            onPress={() => patch({ quantity: qty + 1 })}
            style={[styles.stepBtn, webInlinePressableReset]}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Plus size={14} color={colors.textMuted} weight="bold" />
          </Pressable>
        </View>

        <AppText style={styles.times}>×</AppText>

        <View style={styles.rateBox}>
          <AppText style={styles.ratePrefix}>$</AppText>
          <TextInput
            style={styles.rateInput}
            value={formatMoneyInput(rate)}
            onChangeText={(text) => patch({ unit_price: parseMoneyInput(text) })}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textDim}
          />
        </View>

        <AppText style={styles.lineTotal}>{`$${Math.round(lineAmount(normalized)).toLocaleString('en-US')}`}</AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desc: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.body,
    color: colors.textPrimary,
    paddingVertical: 2,
    minWidth: 0,
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  times: {
    fontSize: 11,
    color: colors.textMuted,
  },
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
  },
  ratePrefix: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 2,
  },
  rateInput: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.textPrimary,
    textAlign: 'right',
    padding: 0,
  },
  lineTotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
