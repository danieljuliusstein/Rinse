'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { VaulSheet } from '@/components/ui'
import { FloatingField, SheetSubmitButton } from '@/components/forms'
import InvoiceAdjustmentsSheet, {
  invoiceToAdjustments,
  type InvoiceAdjustments,
} from '@/components/invoice/InvoiceAdjustmentsSheet'
import InvoiceDocumentBody from '@/components/invoice/InvoiceDocumentBody'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import type { InvoiceLineTemplate } from '@/lib/types'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

export interface InvoiceCustomizeState {
  termsFooter: string
  adjustments: InvoiceAdjustments
  extraLineItems: InvoiceLineTemplate[]
}

interface InvoiceCustomizeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobWithRelations
  invoice: Invoice
  settings: AppSettings
  portalUrl?: string
  lineTemplates: InvoiceLineTemplate[]
  values: InvoiceCustomizeState
  onChange: (patch: Partial<InvoiceCustomizeState>) => void
  onSave: () => void
  onSend: () => void
  busy?: boolean
}

export function buildCustomizeState(invoice: Invoice, settings: AppSettings): InvoiceCustomizeState {
  return {
    termsFooter: invoice.terms?.trim() || settings.invoice_terms_footer?.trim() || '',
    adjustments: invoiceToAdjustments(invoice),
    extraLineItems: invoice.extra_line_items ?? [],
  }
}

export default function InvoiceCustomizeSheet({
  open,
  onOpenChange,
  job,
  invoice,
  settings,
  portalUrl,
  lineTemplates,
  values,
  onChange,
  onSave,
  onSend,
  busy = false,
}: InvoiceCustomizeSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, values])

  const previewInvoice = useMemo(
    (): Invoice => ({
      ...invoice,
      terms: values.termsFooter,
      discount_amount: values.adjustments.discount_amount,
      tax_rate: values.adjustments.tax_rate,
      po_number: values.adjustments.po_number,
      extra_line_items: values.extraLineItems,
    }),
    [invoice, values]
  )

  const previewSettings = useMemo(
    (): AppSettings => ({
      ...settings,
      invoice_terms_footer: values.termsFooter,
    }),
    [settings, values.termsFooter]
  )

  const addTemplateLine = (template: InvoiceLineTemplate) => {
    onChange({
      extraLineItems: [
        ...values.extraLineItems,
        {
          id: template.id,
          description: template.description,
          default_amount: template.default_amount,
          category: template.category,
          active: true,
        },
      ],
    })
  }

  const removeExtraLine = (index: number) => {
    onChange({ extraLineItems: values.extraLineItems.filter((_, i) => i !== index) })
  }

  return (
    <>
      <VaulSheet open={open} onOpenChange={onOpenChange} title="Customize invoice">
        <div ref={formRef} className="invoice-customize-sheet">
          <p className="invoice-customize-sheet__hint">
            Tweak how this invoice looks before you send it.
          </p>

          {settings.logo_url ? (
            <div className="invoice-customize-sheet__logo">
              <img src={settings.logo_url} alt="" />
              <span>Your logo from settings</span>
            </div>
          ) : null}

          <FloatingField
            id="inv-custom-terms"
            label="Terms footer"
            filled={values.termsFooter.trim().length > 0}
          >
            <textarea
              id="inv-custom-terms"
              className={`f-input f-input--textarea${values.termsFooter.trim() ? ' hv' : ''}`}
              placeholder=" "
              rows={3}
              value={values.termsFooter}
              onChange={(e) => onChange({ termsFooter: e.target.value })}
            />
          </FloatingField>

          <button type="button" className="invoice-customize-sheet__link" onClick={() => setAdjustOpen(true)}>
            Discount, tax & PO…
          </button>

          {lineTemplates.length > 0 ? (
            <div className="invoice-customize-sheet__lines">
              <p className="invoice-customize-sheet__lines-label">Add line from library</p>
              <div className="chips">
                {lineTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="chip"
                    onClick={() => addTemplateLine(t)}
                  >
                    {t.description}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {values.extraLineItems.length > 0 ? (
            <ul className="invoice-customize-sheet__extra">
              {values.extraLineItems.map((line, index) => (
                <li key={`${line.id}-${index}`}>
                  <span>{line.description}</span>
                  <span>${line.default_amount}</span>
                  <button type="button" aria-label="Remove line" onClick={() => removeExtraLine(index)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="invoice-customize-sheet__preview">
            <InvoiceDocumentBody
              job={job}
              invoice={previewInvoice}
              settings={previewSettings}
              portalUrl={portalUrl}
            />
          </div>

          <div className="invoice-customize-sheet__actions">
            <SheetSubmitButton label="Save" ready disabled={busy} onClick={onSave} />
            <button type="button" className="btn-secondary" disabled={busy} onClick={onSend}>
              Save & send
            </button>
            <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
              Skip
            </button>
          </div>
        </div>
      </VaulSheet>

      <InvoiceAdjustmentsSheet
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        values={values.adjustments}
        onChange={(patch) =>
          onChange({ adjustments: { ...values.adjustments, ...patch } })
        }
        onSave={() => setAdjustOpen(false)}
      />
    </>
  )
}
