import { Pressable, StyleSheet, View } from 'react-native'
import { Trash } from 'phosphor-react-native'
import {
  INVOICE_LINE_UNIT_OPTIONS,
  formatBillingLineDetail,
  lineAmount,
  normalizeBillingLine,
  type InvoiceLineTemplate,
  type InvoiceLineUnit,
} from '@rinse/core'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { FormField } from '@/src/components/FormField'
import { PillGroup } from '@/src/components/ui/PillGroup'
import { formatInvoiceMoney } from '@/src/lib/invoice-layout'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'

export function HybridLineEditor({
  line,
  onChange,
  onRemove,
  showDescription = true,
}: {
  line: InvoiceLineTemplate
  onChange: (next: InvoiceLineTemplate) => void
  onRemove?: () => void
  showDescription?: boolean
}) {
  const normalized = normalizeBillingLine(line)
  const detail = formatBillingLineDetail(normalized)

  const patch = (partial: Partial<InvoiceLineTemplate>) => {
    onChange(
      normalizeBillingLine({
        ...normalized,
        ...partial,
      }),
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {showDescription ? (
          <FormField
            label="Description"
            value={normalized.description}
            onChangeText={(description) => patch({ description })}
            style={styles.descField}
          />
        ) : (
          <AppText variant="bodySemiBold" style={styles.title} numberOfLines={2}>
            {normalized.description}
          </AppText>
        )}
        {onRemove ? (
          <Pressable
            style={[styles.iconBtn, webInlinePressableReset]}
            onPress={onRemove}
            accessibilityLabel="Remove line"
          >
            <View>
              <Trash size={16} color={colors.danger} />
            </View>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <FormField
          label="Qty"
          value={String(normalized.quantity ?? 1)}
          onChangeText={(text) => {
            const quantity = Number.parseFloat(text)
            patch({ quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 })
          }}
          keyboardType="decimal-pad"
          style={styles.qtyField}
        />
        <AffixField
          label="Unit price"
          value={String(normalized.unit_price ?? 0)}
          onChangeText={(text) => {
            const unit_price = Number.parseFloat(text)
            patch({ unit_price: Number.isFinite(unit_price) && unit_price >= 0 ? unit_price : 0 })
          }}
          keyboardType="decimal-pad"
          style={styles.priceField}
        />
      </View>

      <PillGroup
        label="Unit"
        options={INVOICE_LINE_UNIT_OPTIONS}
        value={(normalized.unit ?? 'each') as InvoiceLineUnit}
        onChange={(unit) => patch({ unit })}
      />

      <View style={styles.totalRow}>
        <AppText variant="caption" style={styles.hint}>
          {detail ?? 'Line total'}
        </AppText>
        <AppText variant="bodySemiBold">{formatInvoiceMoney(lineAmount(normalized))}</AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
  },
  descField: {
    flex: 1,
    marginBottom: 0,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qtyField: {
    width: 88,
    marginBottom: 0,
  },
  priceField: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    color: colors.textMuted,
  },
})
