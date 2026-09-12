'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { VaulSheet } from '@/components/ui'
import { FloatingField, ReorderableList, SheetSubmitButton } from '@/components/forms'
import InvoiceAdjustmentsSheet, {
  invoiceToAdjustments,
  type InvoiceAdjustments,
} from '@/components/invoice/InvoiceAdjustmentsSheet'
import InvoiceDocumentBody from '@/components/invoice/InvoiceDocumentBody'
import { useRinseForm } from '@/hooks/useRinseForm'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { invoiceCustomizeSchema, type InvoiceCustomizeFormValues } from '@/lib/validation'
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

  const { control, watch, reset, submitWithToast } = useRinseForm<InvoiceCustomizeFormValues>({
    schema: invoiceCustomizeSchema,
    defaultValues: {
      termsFooter: '',
    },
  })

  const termsFooter = watch('termsFooter') ?? ''

  useEffect(() => {
    if (!open) return
    reset({
      termsFooter: values.termsFooter,
    })
  }, [open, values.termsFooter, reset])

  useEffect(() => {
    if (!open) return
    syncPrefilledFloatingLabels(formRef.current)
  }, [open, termsFooter])

  const previewInvoice = useMemo(
    (): Invoice => ({
      ...invoice,
      terms: termsFooter,
      discount_amount: values.adjustments.discount_amount,
      tax_rate: values.adjustments.tax_rate,
      po_number: values.adjustments.po_number,
      extra_line_items: values.extraLineItems,
    }),
    [invoice, termsFooter, values]
  )

  const previewSettings = useMemo(
    (): AppSettings => ({
      ...settings,
      invoice_terms_footer: termsFooter,
    }),
    [settings, termsFooter]
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

  const handleSave = submitWithToast((formValues) => {
    onChange({ termsFooter: formValues.termsFooter ?? '' })
    onSave()
  })

  const handleSaveAndSend = submitWithToast((formValues) => {
    onChange({ termsFooter: formValues.termsFooter ?? '' })
    onSend()
  })

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

          <Controller
            control={control}
            name="termsFooter"
            render={({ field, fieldState }) => (
              <FloatingField
                id="inv-custom-terms"
                label="Terms footer"
                filled={Boolean(field.value?.trim())}
                error={fieldState.error?.message}
                optional
              >
                <textarea
                  id="inv-custom-terms"
                  className={`f-input f-input--textarea${field.value?.trim() ? ' hv' : ''}`}
                  placeholder=" "
                  rows={3}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FloatingField>
            )}
          />

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
            <ReorderableList
              className="invoice-customize-sheet__extra"
              droppableId="invoice-extra-lines"
              items={values.extraLineItems}
              getItemId={(line, index) => `${line.id}-${index}`}
              onReorder={(next) => onChange({ extraLineItems: next })}
              itemClassName="invoice-customize-sheet__extra-item reorderable-list__item"
              renderItem={(line, index) => (
                <>
                  <span>{line.description}</span>
                  <span>${line.default_amount}</span>
                  <button type="button" aria-label="Remove line" onClick={() => removeExtraLine(index)}>
                    ×
                  </button>
                </>
              )}
            />
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
            <SheetSubmitButton label="Save" ready disabled={busy} onClick={() => void handleSave()} />
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void handleSaveAndSend()}>
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
