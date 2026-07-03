'use client'

import { Check } from '@phosphor-icons/react'
import InvoiceTemplateMock from './InvoiceTemplateMock'
import { INVOICE_TEMPLATES, type InvoiceTemplateId } from '@/lib/invoice-templates'

interface InvoiceTemplateGalleryProps {
  value: InvoiceTemplateId
  onChange: (template: InvoiceTemplateId) => void
  accent: string
  businessName: string
  logoUrl?: string
}

export default function InvoiceTemplateGallery({
  value,
  onChange,
  accent,
  businessName,
  logoUrl,
}: InvoiceTemplateGalleryProps) {
  return (
    <div className="invoice-template-gallery" role="radiogroup" aria-label="Invoice template">
      {INVOICE_TEMPLATES.map((tpl) => {
        const selected = value === tpl.id
        return (
          <button
            key={tpl.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`invoice-template-card${selected ? ' invoice-template-card--on' : ''}`}
            onClick={() => onChange(tpl.id)}
          >
            <InvoiceTemplateMock
              template={tpl.id}
              accent={accent}
              businessName={businessName}
              logoUrl={logoUrl}
              scale="thumbnail"
            />
            <div className="invoice-template-card__meta">
              <span className="invoice-template-card__label">{tpl.label}</span>
              {selected ? (
                <Check size={14} weight="bold" className="invoice-template-card__check" aria-hidden="true" />
              ) : null}
            </div>
            <span className="invoice-template-card__desc">{tpl.description}</span>
          </button>
        )
      })}
    </div>
  )
}
