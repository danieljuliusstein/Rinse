'use client'

import { useEffect, useRef } from 'react'
import { VaulSheet } from '@/components/ui'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { PAYMENT_METHODS } from '@/lib/invoices'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'

interface InvoicePaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balanceDue: number
  amount: number
  method: string
  onAmountChange: (value: number) => void
  onMethodChange: (value: string) => void
  onSubmit: () => void
  busy?: boolean
}

export default function InvoicePaymentSheet({
  open,
  onOpenChange,
  balanceDue,
  amount,
  method,
  onAmountChange,
  onMethodChange,
  onSubmit,
  busy = false,
}: InvoicePaymentSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const methodRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(methodRef.current)
  }, [open, amount, method])

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Log payment">
      <div ref={formRef} className="invoice-payment-sheet">
        <p className="invoice-payment-sheet__hint">
          Balance due: <strong>${balanceDue.toFixed(2)}</strong>
        </p>
        <FloatingAffixField
          id="sheet-pay-amount"
          label="Amount"
          filled={amount > 0}
          type="number"
          value={amount || ''}
          onChange={(e) => onAmountChange(Number(e.target.value))}
        />
        <FloatingField id="sheet-pay-method" label="Method" filled={Boolean(method)}>
          <select
            ref={methodRef}
            id="sheet-pay-method"
            className={`f-select${method ? ' hv' : ''}`}
            value={method}
            onChange={(e) => {
              onMethodChange(e.target.value)
              syncSelectFloatingLabel(methodRef.current)
            }}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FloatingField>
        <div className="invoice-payment-sheet__submit">
          <SheetSubmitButton
            label="Save payment"
            ready={amount > 0}
            disabled={busy}
            onClick={onSubmit}
          />
        </div>
      </div>
    </VaulSheet>
  )
}
