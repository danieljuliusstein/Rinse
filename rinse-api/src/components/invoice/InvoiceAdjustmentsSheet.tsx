'use client'

import { useEffect, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { VaulSheet } from '@/components/ui'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { invoiceAdjustmentsSchema, type InvoiceAdjustmentsFormValues } from '@/lib/validation'
import type { Invoice } from '@/lib/types'

export interface InvoiceAdjustments {
  discount_amount: number
  tax_rate: number
  po_number: string
}

interface InvoiceAdjustmentsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: InvoiceAdjustments
  onChange: (patch: Partial<InvoiceAdjustments>) => void
  onSave: () => void
  busy?: boolean
}

export default function InvoiceAdjustmentsSheet({
  open,
  onOpenChange,
  values,
  onChange,
  onSave,
  busy = false,
}: InvoiceAdjustmentsSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)

  const { control, watch, reset, submitWithToast } = useRinseForm<InvoiceAdjustmentsFormValues>({
    schema: invoiceAdjustmentsSchema,
    defaultValues: {
      discount_amount: 0,
      tax_rate: 0,
      po_number: '',
    },
  })

  const discount = watch('discount_amount')
  const taxRate = watch('tax_rate')
  const poNumber = watch('po_number')

  useEffect(() => {
    if (!open) return
    reset({
      discount_amount: values.discount_amount,
      tax_rate: values.tax_rate,
      po_number: values.po_number,
    })
  }, [open, values, reset])

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, discount, taxRate, poNumber])

  const handleSave = submitWithToast((formValues) => {
    onChange({
      discount_amount: formValues.discount_amount,
      tax_rate: formValues.tax_rate,
      po_number: formValues.po_number ?? '',
    })
    onSave()
  })

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Adjustments">
      <div ref={formRef} className="invoice-payment-sheet">
        <Controller
          control={control}
          name="discount_amount"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="inv-discount"
              label="Discount"
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
          name="tax_rate"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="inv-tax"
              label="Tax rate (%)"
              prefix="%"
              value={field.value || ''}
              filled={field.value > 0}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="po_number"
          render={({ field, fieldState }) => (
            <FloatingField
              id="inv-po"
              label="PO number"
              filled={Boolean(field.value?.trim())}
              error={fieldState.error?.message}
            >
              <input
                id="inv-po"
                className={`f-input${field.value?.trim() ? ' hv' : ''}`}
                placeholder=" "
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FloatingField>
          )}
        />
        <div className="invoice-payment-sheet__submit">
          <SheetSubmitButton label="Save" ready disabled={busy} onClick={() => void handleSave()} />
        </div>
      </div>
    </VaulSheet>
  )
}

export function invoiceToAdjustments(invoice: Invoice): InvoiceAdjustments {
  return {
    discount_amount: invoice.discount_amount ?? 0,
    tax_rate: invoice.tax_rate ?? 0,
    po_number: invoice.po_number ?? '',
  }
}
