'use client'

import { useEffect, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { VaulSheet } from '@/components/ui'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { PAYMENT_METHODS } from '@/lib/invoices'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { invoicePaymentSchema, type InvoicePaymentFormValues } from '@/lib/validation'

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
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

  const { control, watch, reset, submitWithToast } = useRinseForm<InvoicePaymentFormValues>({
    schema: invoicePaymentSchema,
    defaultValues: {
      amount: 0,
      method: PAYMENT_METHODS[0] ?? '',
      date: todayIso(),
      notes: '',
    },
  })

  const payAmount = watch('amount')
  const payMethod = watch('method')

  useEffect(() => {
    if (!open) return
    reset({
      amount,
      method: method || (PAYMENT_METHODS[0] ?? ''),
      date: todayIso(),
      notes: '',
    })
  }, [open, amount, method, reset])

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(methodRef.current)
  }, [open, payAmount, payMethod])

  const handleSubmit = submitWithToast((values) => {
    onAmountChange(values.amount)
    onMethodChange(values.method)
    onSubmit()
  })

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Log payment">
      <div ref={formRef} className="invoice-payment-sheet">
        <p className="invoice-payment-sheet__hint">
          Balance due: <strong>${balanceDue.toFixed(2)}</strong>
        </p>
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="sheet-pay-amount"
              label="Amount"
              currency
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="method"
          render={({ field, fieldState }) => (
            <FloatingField id="sheet-pay-method" label="Method" filled={Boolean(field.value)} error={fieldState.error?.message}>
              <select
                ref={methodRef}
                id="sheet-pay-method"
                className={`f-select${field.value ? ' hv' : ''}`}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  syncSelectFloatingLabel(methodRef.current)
                }}
                onBlur={field.onBlur}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FloatingField>
          )}
        />
        <div className="invoice-payment-sheet__submit">
          <SheetSubmitButton
            label="Save payment"
            ready={payAmount > 0}
            disabled={busy}
            onClick={() => void handleSubmit()}
          />
        </div>
      </div>
    </VaulSheet>
  )
}
