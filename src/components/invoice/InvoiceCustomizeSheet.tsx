import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CaretDown, CaretUp, Plus, Trash } from 'phosphor-react-native'
import type { Invoice, InvoiceLineTemplate } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { FormField } from '@/src/components/FormField'
import { formatInvoiceMoney } from '@/src/lib/invoice-layout'
import { getInvoiceLineTemplates } from '@/src/lib/invoice-line-templates-api'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'

export type InvoiceCustomizeValues = {
  discount_amount: number
  tax_rate: number
  po_number: string
  extra_line_items: InvoiceLineTemplate[]
}

export function InvoiceCustomizeSheet({
  visible,
  onClose,
  invoice,
  jobRevenue,
  busy,
  saveLabel = 'Save',
  onSave,
}: {
  visible: boolean
  onClose: () => void
  invoice: Invoice
  jobRevenue: number
  busy?: boolean
  saveLabel?: string
  onSave: (values: InvoiceCustomizeValues) => void
}) {
  const [discountText, setDiscountText] = useState('0')
  const [taxText, setTaxText] = useState('0')
  const [po, setPo] = useState('')
  const [extras, setExtras] = useState<InvoiceLineTemplate[]>([])
  const [library, setLibrary] = useState<InvoiceLineTemplate[]>([])

  useEffect(() => {
    if (!visible) return
    setDiscountText(String(invoice.discount_amount ?? 0))
    setTaxText(String(invoice.tax_rate ?? 0))
    setPo(invoice.po_number ?? '')
    setExtras([...(invoice.extra_line_items ?? [])])
    void getInvoiceLineTemplates().then(setLibrary).catch(() => setLibrary([]))
  }, [visible, invoice])

  const extrasSum = useMemo(
    () => extras.reduce((s, l) => s + l.default_amount, 0),
    [extras],
  )
  const previewSubtotal = jobRevenue + extrasSum

  const availableLibrary = library.filter(
    (t) => !extras.some((e) => e.id === t.id && e.description === t.description),
  )

  const moveExtra = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= extras.length) return
    setExtras((rows) => {
      const copy = [...rows]
      const tmp = copy[index]
      copy[index] = copy[next]
      copy[next] = tmp
      return copy
    })
  }

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Edit line items"
      subtitle="Extras, tax & discount for this invoice"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={saveLabel}
            loading={busy}
            onPress={() =>
              onSave({
                discount_amount: Number.parseFloat(discountText) || 0,
                tax_rate: Number.parseFloat(taxText) || 0,
                po_number: po.trim(),
                extra_line_items: extras,
              })
            }
          />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      }
    >
      <AppText variant="caption" style={styles.hint}>
        Look & feel (template, accent, terms) is set in Settings → Invoicing for all invoices.
      </AppText>

      <AppText variant="sectionLabel">Package</AppText>
      <View style={styles.packageRow}>
        <AppText variant="bodySemiBold">Service</AppText>
        <AppText variant="bodySemiBold">{formatInvoiceMoney(jobRevenue)}</AppText>
      </View>

      <AppText variant="sectionLabel">Extra line items</AppText>
      {extras.length === 0 ? (
        <AppText variant="caption" style={styles.hint}>
          Add lines from your library below.
        </AppText>
      ) : (
        extras.map((line, index) => (
          <View key={`${line.id}-${index}`} style={styles.extraRow}>
            <View style={styles.extraText}>
              <AppText variant="bodySemiBold" numberOfLines={1}>
                {line.description}
              </AppText>
              <AppText variant="caption" style={styles.hint}>
                {formatInvoiceMoney(line.default_amount)}
              </AppText>
            </View>
            <View style={styles.extraActions}>
              <Pressable
                style={[styles.iconBtn, webInlinePressableReset]}
                onPress={() => moveExtra(index, -1)}
                disabled={index === 0}
                accessibilityLabel="Move up"
              >
                <View>
                  <CaretUp size={16} color={index === 0 ? colors.textDim : colors.textSecondary} />
                </View>
              </Pressable>
              <Pressable
                style={[styles.iconBtn, webInlinePressableReset]}
                onPress={() => moveExtra(index, 1)}
                disabled={index === extras.length - 1}
                accessibilityLabel="Move down"
              >
                <View>
                  <CaretDown
                    size={16}
                    color={index === extras.length - 1 ? colors.textDim : colors.textSecondary}
                  />
                </View>
              </Pressable>
              <Pressable
                style={[styles.iconBtn, webInlinePressableReset]}
                onPress={() => setExtras((rows) => rows.filter((_, i) => i !== index))}
                accessibilityLabel="Remove line"
              >
                <View>
                  <Trash size={16} color={colors.danger} />
                </View>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {availableLibrary.length > 0 ? (
        <View style={styles.library}>
          <AppText variant="sectionLabel">From library</AppText>
          {availableLibrary.map((template) => (
            <Pressable
              key={template.id}
              style={({ pressed }) => [styles.libraryRow, webInlinePressableReset, pressed && styles.pressed]}
              onPress={() =>
                setExtras((rows) => [
                  ...rows,
                  {
                    id: template.id,
                    description: template.description,
                    default_amount: template.default_amount,
                    category: template.category,
                    active: true,
                  },
                ])
              }
              accessibilityRole="button"
              accessibilityLabel={`Add ${template.description}`}
            >
              <View style={styles.libraryRowInner}>
                <Plus size={16} color={colors.greenText} weight="bold" />
                <View style={styles.extraText}>
                  <AppText variant="bodySemiBold">{template.description}</AppText>
                  <AppText variant="caption" style={styles.hint}>
                    {formatInvoiceMoney(template.default_amount)}
                  </AppText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <AppText variant="caption" style={styles.hint}>
          No more library lines. Add templates in Settings → Invoicing.
        </AppText>
      )}

      <AppText variant="sectionLabel">Adjustments</AppText>
      <AffixField label="Discount" value={discountText} onChangeText={setDiscountText} keyboardType="decimal-pad" />
      <FormField label="Tax rate (%)" value={taxText} onChangeText={setTaxText} keyboardType="decimal-pad" />
      <FormField label="PO number" value={po} onChangeText={setPo} />

      <View style={styles.previewTotal}>
        <AppText variant="caption" style={styles.hint}>
          Line subtotal (service + extras)
        </AppText>
        <AppText variant="bodySemiBold">{formatInvoiceMoney(previewSubtotal)}</AppText>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceActive,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  extraText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  extraActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  library: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  libraryRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  libraryRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  previewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
})
