import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { PAYMENT_METHODS } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { FormField } from '@/src/components/FormField'
import { colors, spacing } from '@/src/theme/colors'

export function InvoiceSendSheet({
  visible,
  onClose,
  onEmail,
  onCopyLink,
  onPdf,
  canEmail,
  busy,
  linkCopied,
}: {
  visible: boolean
  onClose: () => void
  onEmail: () => void
  onCopyLink: () => void
  onPdf: () => void
  canEmail: boolean
  busy?: boolean
  linkCopied?: boolean
}) {
  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Send invoice"
      subtitle="Share with your client"
      onClose={onClose}
    >
      {canEmail ? (
        <PrimaryButton label="Send via email" loading={busy} onPress={onEmail} />
      ) : (
        <AppText variant="caption" style={styles.hint}>
          Add a client email on their profile to send from here.
        </AppText>
      )}
      <SecondaryButton
        label={linkCopied ? 'Link copied' : 'Copy payment link'}
        loading={busy}
        onPress={onCopyLink}
      />
      <SecondaryButton label="Download PDF" loading={busy} onPress={onPdf} />
    </AppSheet>
  )
}

export function InvoicePaymentSheet({
  visible,
  onClose,
  balanceDue,
  onSubmit,
  busy,
}: {
  visible: boolean
  onClose: () => void
  balanceDue: number
  onSubmit: (amount: number, method: string) => void
  busy?: boolean
}) {
  const [amount, setAmount] = useState(String(balanceDue))
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0] ?? 'Cash')

  useEffect(() => {
    if (visible) setAmount(String(balanceDue))
  }, [visible, balanceDue])

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Log payment"
      subtitle={`Balance due $${balanceDue.toFixed(2)}`}
      onClose={onClose}
    >
      <AffixField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <View style={styles.methodBlock}>
        <AppText variant="sectionLabel">Method</AppText>
        <PillGroup
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
          value={method}
          onChange={setMethod}
          inline
        />
      </View>
      <PrimaryButton
        label="Record payment"
        loading={busy}
        onPress={() => onSubmit(Number.parseFloat(amount) || 0, method)}
      />
      <SecondaryButton label="Cancel" onPress={onClose} />
    </AppSheet>
  )
}

export function InvoiceAdjustmentsSheet({
  visible,
  onClose,
  discount,
  taxRate,
  poNumber,
  onSave,
  busy,
}: {
  visible: boolean
  onClose: () => void
  discount: number
  taxRate: number
  poNumber: string
  onSave: (patch: {
    discount_amount: number
    tax_rate: number
    po_number: string
  }) => void
  busy?: boolean
}) {
  const [discountText, setDiscountText] = useState(String(discount))
  const [taxText, setTaxText] = useState(String(taxRate))
  const [po, setPo] = useState(poNumber)

  useEffect(() => {
    if (!visible) return
    setDiscountText(String(discount))
    setTaxText(String(taxRate))
    setPo(poNumber)
  }, [visible, discount, taxRate, poNumber])

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Adjustments"
      subtitle="Discount, tax, PO"
      onClose={onClose}
    >
      <AppText variant="caption" style={styles.hint}>
        Terms footer is edited in Settings → Invoicing and applies to all invoices.
      </AppText>
      <AffixField label="Discount" value={discountText} onChangeText={setDiscountText} keyboardType="decimal-pad" />
      <FormField label="Tax rate (%)" value={taxText} onChangeText={setTaxText} keyboardType="decimal-pad" />
      <FormField label="PO number" value={po} onChangeText={setPo} />
      <PrimaryButton
        label="Save adjustments"
        loading={busy}
        onPress={() =>
          onSave({
            discount_amount: Number.parseFloat(discountText) || 0,
            tax_rate: Number.parseFloat(taxText) || 0,
            po_number: po.trim(),
          })
        }
      />
      <SecondaryButton label="Cancel" onPress={onClose} />
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  methodBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
})
