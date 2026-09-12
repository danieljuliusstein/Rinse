import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { Plus, Trash } from '@/src/icons'
import {
  INVOICE_LINE_UNIT_OPTIONS,
  formatBillingLineDetail,
  lineAmount,
  normalizeBillingLine,
  type InvoiceLineTemplate,
  type InvoiceLineUnit,
} from '@rinse/core'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PillGroup } from '@/src/components/ui'
import {
  deleteInvoiceLineTemplate,
  getInvoiceLineTemplates,
  saveInvoiceLineTemplate,
} from '@/src/lib/invoice-line-templates-api'
import { formatInvoiceMoney } from '@/src/lib/invoice-layout'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function InvoiceLineTemplateManager() {
  const [templates, setTemplates] = useState<InvoiceLineTemplate[]>([])
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [unit, setUnit] = useState<InvoiceLineUnit>('each')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setTemplates(await getInvoiceLineTemplates())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const preview = normalizeBillingLine({
    description: description.trim() || 'Line',
    quantity: Number.parseFloat(quantity) || 1,
    unit_price: Number.parseFloat(unitPrice) || 0,
    unit,
  })

  const handleAdd = async () => {
    const qty = Number.parseFloat(quantity)
    const price = Number.parseFloat(unitPrice)
    if (!description.trim() || !(qty > 0) || !(price >= 0) || !(qty * price > 0)) return
    setBusy(true)
    try {
      const line = normalizeBillingLine({
        description: description.trim(),
        quantity: qty,
        unit_price: price,
        unit,
      })
      await saveInvoiceLineTemplate({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        unit: line.unit,
        default_amount: line.default_amount,
      })
      setDescription('')
      setQuantity('1')
      setUnitPrice('')
      setUnit('each')
      await refresh()
    } catch (e) {
      Alert.alert('Could not save line', e instanceof Error ? e.message : 'Try again')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (template: InvoiceLineTemplate) => {
    Alert.alert('Delete line?', `Remove "${template.description}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteInvoiceLineTemplate(template.id)
              await refresh()
            } catch (e) {
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>Line item library</AppText>
      <AppText style={styles.lead}>
        Reusable qty × rate lines for quotes and invoices — e.g. 2.5 hr @ $50/hr.
      </AppText>

      <BusinessFilledField label="Description" value={description} onChangeText={setDescription} />
      <View style={styles.row}>
        <View style={styles.qty}>
          <BusinessFilledField
            label="Qty"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <AffixField
          label="Unit price"
          value={unitPrice}
          onChangeText={setUnitPrice}
          keyboardType="decimal-pad"
          style={styles.price}
        />
      </View>
      <PillGroup
        label="Unit"
        options={INVOICE_LINE_UNIT_OPTIONS}
        value={unit}
        onChange={setUnit}
      />
      <AppText variant="caption" style={styles.preview}>
        Preview: {formatBillingLineDetail(preview) ?? 'Flat'} · {formatInvoiceMoney(lineAmount(preview))}
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleAdd()}
        disabled={busy || !description.trim() || !(lineAmount(preview) > 0)}
        style={({ pressed }) => [styles.addBtn, pressed ? styles.addBtnPressed : null]}
      >
        <Plus size={16} color={colors.textPrimary} weight="bold" />
        <AppText style={styles.addBtnLabel}>Add line</AppText>
      </Pressable>

      {templates.length > 0 ? (
        <View style={styles.list}>
          {templates.map((template) => {
            const line = normalizeBillingLine(template)
            return (
              <View key={template.id} style={styles.rowItem}>
                <View style={styles.rowCopy}>
                  <AppText variant="bodySemiBold">{line.description}</AppText>
                  <AppText variant="caption" style={styles.amount}>
                    {formatBillingLineDetail(line)
                      ? `${formatBillingLineDetail(line)} · ${formatInvoiceMoney(lineAmount(line))}`
                      : formatInvoiceMoney(lineAmount(line))}
                  </AppText>
                </View>
                <Pressable
                  accessibilityLabel={`Delete ${template.description}`}
                  onPress={() => handleDelete(template)}
                  style={styles.deleteBtn}
                >
                  <Trash size={18} color={colors.danger} />
                </Pressable>
              </View>
            )
          })}
        </View>
      ) : (
        <AppText style={styles.empty}>No saved lines yet.</AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qty: {
    width: 88,
  },
  price: {
    flex: 1,
  },
  preview: {
    color: colors.textMuted,
  },
  list: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  amount: {
    color: colors.textSecondary,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addBtnPressed: {
    opacity: 0.85,
  },
  addBtnLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
})
