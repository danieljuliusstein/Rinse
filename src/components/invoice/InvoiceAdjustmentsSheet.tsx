'use client'

import { useEffect, useRef } from 'react'
import { VaulSheet } from '@/components/ui'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
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

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, values])

  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Adjustments">
      <div ref={formRef} className="invoice-payment-sheet">
        <FloatingAffixField
          id="inv-discount"
          label="Discount"
          filled={values.discount_amount > 0}
          type="number"
          value={values.discount_amount || ''}
          onChange={(e) => onChange({ discount_amount: Number(e.target.value) })}
        />
        <FloatingAffixField
          id="inv-tax"
          label="Tax rate (%)"
          prefix="%"
          filled={values.tax_rate > 0}
          type="number"
          value={values.tax_rate || ''}
          onChange={(e) => onChange({ tax_rate: Number(e.target.value) })}
        />
        <FloatingField id="inv-po" label="PO number" filled={Boolean(values.po_number.trim())}>
          <input
            id="inv-po"
            className={`f-input${values.po_number.trim() ? ' hv' : ''}`}
            placeholder=" "
            value={values.po_number}
            onChange={(e) => onChange({ po_number: e.target.value })}
          />
        </FloatingField>
        <div className="invoice-payment-sheet__submit">
          <SheetSubmitButton label="Save" ready disabled={busy} onClick={onSave} />
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
