import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { PAYMENT_METHODS } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { DraftResumeBanner } from '@/src/components/ui/DraftResumeBanner'
import { FormField } from '@/src/components/FormField'
import { useAutoSaveDraft } from '@/src/hooks/useAutoSaveDraft'
import { colors, spacing } from '@/src/theme/colors'

export function InvoiceSendSheet({
  visible,
  onClose,
  onEmail,
  onSms,
  onCopyLink,
  onPdf,
  onTransformationPdf,
  canEmail,
  canTransformationPdf,
  busy,
  linkCopied,
}: {
  visible: boolean
  onClose: () => void
  onEmail: () => void
  onSms: () => void
  onCopyLink: () => void
  onPdf: () => void
  onTransformationPdf?: () => void
  canEmail: boolean
  canTransformationPdf?: boolean
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
      <PrimaryButton label="Send via SMS" loading={busy} onPress={onSms ?? (() => {})} />
      <SecondaryButton
        label={linkCopied ? 'Link copied' : 'Copy payment link'}
        loading={busy}
        onPress={onCopyLink}
      />
      <SecondaryButton label="Download invoice PDF" loading={busy} onPress={onPdf} />
      {onTransformationPdf ? (
        <SecondaryButton
          label={
            canTransformationPdf === false
              ? 'Before/after PDF (need photos)'
              : 'Download before/after PDF'
          }
          loading={busy}
          onPress={onTransformationPdf}
        />
      ) : null}
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
  invoiceId,
  discount,
  taxRate,
  poNumber,
  onSave,
  busy,
}: {
  visible: boolean
  onClose: () => void
  invoiceId: string
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
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const seededRef = useRef(false)
  const baselineKeyRef = useRef('')

  type AdjustDraft = {
    discount_amount: number
    tax_rate: number
    po_number: string
  }

  const draftValue = useMemo<AdjustDraft>(
    () => ({
      discount_amount: Number.parseFloat(discountText) || 0,
      tax_rate: Number.parseFloat(taxText) || 0,
      po_number: po,
    }),
    [discountText, taxText, po]
  )

  const { restored, restoredAt, hydrated, clearDraft } = useAutoSaveDraft<AdjustDraft>({
    entity: 'invoice',
    entityId: `${invoiceId}:adjust`,
    value: draftValue,
    enabled: visible,
    isEmpty: (v) =>
      JSON.stringify(v) === baselineKeyRef.current,
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

    const server: AdjustDraft = {
      discount_amount: discount,
      tax_rate: taxRate,
      po_number: poNumber,
    }
    baselineKeyRef.current = JSON.stringify(server)

    if (restored) {
      setDiscountText(String(restored.discount_amount))
      setTaxText(String(restored.tax_rate))
      setPo(restored.po_number)
      setShowResumeBanner(true)
    } else {
      setDiscountText(String(discount))
      setTaxText(String(taxRate))
      setPo(poNumber)
      setShowResumeBanner(false)
    }
  }, [visible, hydrated, restored, discount, taxRate, poNumber])

  const discardDraft = () => {
    void clearDraft().then(() => {
      setDiscountText(String(discount))
      setTaxText(String(taxRate))
      setPo(poNumber)
      baselineKeyRef.current = JSON.stringify({
        discount_amount: discount,
        tax_rate: taxRate,
        po_number: poNumber,
      })
      setShowResumeBanner(false)
    })
  }

  const handleSave = () => {
    const patch = {
      discount_amount: Number.parseFloat(discountText) || 0,
      tax_rate: Number.parseFloat(taxText) || 0,
      po_number: po.trim(),
    }
    void clearDraft().then(() => {
      baselineKeyRef.current = JSON.stringify(patch)
      setShowResumeBanner(false)
      onSave(patch)
    })
  }

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Adjustments"
      subtitle="Discount, tax, PO"
      onClose={onClose}
    >
      {showResumeBanner ? (
        <DraftResumeBanner restoredAt={restoredAt} onDiscard={discardDraft} />
      ) : null}
      <AppText variant="caption" style={styles.hint}>
        Terms footer is edited in Settings → Invoicing and applies to all invoices.
      </AppText>
      <AffixField label="Discount" value={discountText} onChangeText={setDiscountText} keyboardType="decimal-pad" />
      <FormField label="Tax rate (%)" value={taxText} onChangeText={setTaxText} keyboardType="decimal-pad" />
      <FormField label="PO number" value={po} onChangeText={setPo} />
      <PrimaryButton label="Save adjustments" loading={busy} onPress={handleSave} />
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
