import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CaretDown, CaretUp, Plus } from 'phosphor-react-native'
import {
  generatePocketBaseId,
  lineAmount,
  normalizeBillingLine,
  normalizeBillingLines,
  sumLineAmounts,
  type Invoice,
  type InvoiceLineTemplate,
} from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { DraftResumeBanner } from '@/src/components/ui/DraftResumeBanner'
import { FormField } from '@/src/components/FormField'
import { HybridLineEditor } from '@/src/components/invoice/HybridLineEditor'
import { useAutoSaveDraft } from '@/src/hooks/useAutoSaveDraft'
import { formatInvoiceMoney } from '@/src/lib/invoice-layout'
import { getInvoiceLineTemplates } from '@/src/lib/invoice-line-templates-api'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'

export type InvoiceCustomizeValues = {
  discount_amount: number
  tax_rate: number
  po_number: string
  extra_line_items: InvoiceLineTemplate[]
}

function valuesFromInvoice(invoice: Invoice): InvoiceCustomizeValues {
  return {
    discount_amount: invoice.discount_amount ?? 0,
    tax_rate: invoice.tax_rate ?? 0,
    po_number: invoice.po_number ?? '',
    extra_line_items: normalizeBillingLines(invoice.extra_line_items),
  }
}

function stableValuesKey(v: InvoiceCustomizeValues): string {
  return JSON.stringify({
    discount_amount: v.discount_amount,
    tax_rate: v.tax_rate,
    po_number: v.po_number,
    extra_line_items: v.extra_line_items,
  })
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
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const seededRef = useRef(false)
  const baselineKeyRef = useRef('')

  const draftValue = useMemo<InvoiceCustomizeValues>(
    () => ({
      discount_amount: Number.parseFloat(discountText) || 0,
      tax_rate: Number.parseFloat(taxText) || 0,
      po_number: po,
      extra_line_items: extras,
    }),
    [discountText, taxText, po, extras],
  )

  const { restored, restoredAt, hydrated, clearDraft } = useAutoSaveDraft<InvoiceCustomizeValues>({
    entity: 'invoice',
    entityId: `${invoice.id}:customize`,
    value: draftValue,
    enabled: visible,
    isEmpty: (v) => stableValuesKey(v) === baselineKeyRef.current,
  })

  useEffect(() => {
    if (!visible) {
      seededRef.current = false
      setShowResumeBanner(false)
    }
  }, [visible])

  useEffect(() => {
    if (!visible || !hydrated || seededRef.current) return
    seededRef.current = true

    const apply = (values: InvoiceCustomizeValues, fromDraft: boolean) => {
      setDiscountText(String(values.discount_amount ?? 0))
      setTaxText(String(values.tax_rate ?? 0))
      setPo(values.po_number ?? '')
      setExtras(normalizeBillingLines(values.extra_line_items))
      setShowResumeBanner(fromDraft)
      if (!fromDraft) {
        baselineKeyRef.current = stableValuesKey(values)
      } else {
        baselineKeyRef.current = stableValuesKey(valuesFromInvoice(invoice))
      }
    }

    if (restored) {
      apply(restored, true)
    } else {
      apply(valuesFromInvoice(invoice), false)
    }

    void getInvoiceLineTemplates().then(setLibrary).catch(() => setLibrary([]))
  }, [visible, hydrated, restored, invoice])

  const extrasSum = useMemo(() => sumLineAmounts(extras), [extras])
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

  const updateExtra = (index: number, next: InvoiceLineTemplate) => {
    setExtras((rows) => rows.map((row, i) => (i === index ? next : row)))
  }

  const addCustomLine = () => {
    setExtras((rows) => [
      ...rows,
      normalizeBillingLine({
        id: generatePocketBaseId(),
        description: 'Custom line',
        quantity: 1,
        unit_price: 0,
        unit: 'each',
      }),
    ])
  }

  const discardDraft = () => {
    void clearDraft().then(() => {
      const server = valuesFromInvoice(invoice)
      setDiscountText(String(server.discount_amount))
      setTaxText(String(server.tax_rate))
      setPo(server.po_number)
      setExtras([...server.extra_line_items])
      baselineKeyRef.current = stableValuesKey(server)
      setShowResumeBanner(false)
    })
  }

  const handleSave = () => {
    const values: InvoiceCustomizeValues = {
      discount_amount: Number.parseFloat(discountText) || 0,
      tax_rate: Number.parseFloat(taxText) || 0,
      po_number: po.trim(),
      extra_line_items: extras.map((line) => normalizeBillingLine(line)),
    }
    void clearDraft().then(() => {
      baselineKeyRef.current = stableValuesKey(values)
      setShowResumeBanner(false)
      onSave(values)
    })
  }

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Edit line items"
      subtitle="Package + qty × rate extras, tax & discount"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <PrimaryButton label={saveLabel} loading={busy} onPress={handleSave} />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      }
    >
      {showResumeBanner ? (
        <DraftResumeBanner restoredAt={restoredAt} onDiscard={discardDraft} />
      ) : null}

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
          Add from your library or a custom qty × rate line.
        </AppText>
      ) : (
        extras.map((line, index) => (
          <View key={`${line.id}-${index}`} style={styles.extraBlock}>
            <HybridLineEditor
              line={line}
              onChange={(next) => updateExtra(index, next)}
              onRemove={() => setExtras((rows) => rows.filter((_, i) => i !== index))}
            />
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
            </View>
          </View>
        ))
      )}

      <Pressable
        style={({ pressed }) => [styles.addCustom, webInlinePressableReset, pressed && styles.pressed]}
        onPress={addCustomLine}
        accessibilityRole="button"
        accessibilityLabel="Add custom line"
      >
        <Plus size={16} color={colors.greenText} weight="bold" />
        <AppText variant="bodySemiBold" style={styles.addCustomLabel}>
          Add custom line
        </AppText>
      </Pressable>

      {availableLibrary.length > 0 ? (
        <View style={styles.library}>
          <AppText variant="sectionLabel">From library</AppText>
          {availableLibrary.map((template) => {
            const normalized = normalizeBillingLine(template)
            return (
              <Pressable
                key={template.id}
                style={({ pressed }) => [
                  styles.libraryRow,
                  webInlinePressableReset,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setExtras((rows) => [
                    ...rows,
                    normalizeBillingLine({
                      ...normalized,
                      id: template.id,
                      active: true,
                    }),
                  ])
                }
                accessibilityRole="button"
                accessibilityLabel={`Add ${template.description}`}
              >
                <View style={styles.libraryRowInner}>
                  <Plus size={16} color={colors.greenText} weight="bold" />
                  <View style={styles.extraText}>
                    <AppText variant="bodySemiBold">{normalized.description}</AppText>
                    <AppText variant="caption" style={styles.hint}>
                      {formatInvoiceMoney(lineAmount(normalized))}
                    </AppText>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      ) : (
        <AppText variant="caption" style={styles.hint}>
          No more library lines. Add templates in Settings → Invoicing.
        </AppText>
      )}

      <AppText variant="sectionLabel">Adjustments</AppText>
      <AffixField
        label="Discount"
        value={discountText}
        onChangeText={setDiscountText}
        keyboardType="decimal-pad"
      />
      <FormField
        label="Tax rate (%)"
        value={taxText}
        onChangeText={setTaxText}
        keyboardType="decimal-pad"
      />
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
  extraBlock: {
    marginBottom: spacing.xs,
  },
  extraActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  addCustomLabel: {
    color: colors.greenText,
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
