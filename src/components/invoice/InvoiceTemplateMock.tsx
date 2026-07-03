'use client'

import type { CSSProperties } from 'react'
import BusinessLogo from '@/components/BusinessLogo'
import { fmt } from '@/lib/calculations'
import type { InvoiceTemplateId } from '@/lib/invoice-templates'

interface InvoiceTemplateMockProps {
  template: InvoiceTemplateId
  accent: string
  businessName: string
  logoUrl?: string
  scale?: 'thumbnail' | 'full'
  clientName?: string
  serviceName?: string
  serviceNote?: string
  amount?: number
}

/** Mini invoice document — uses the same `invoice-doc` classes as client PDF preview. */
export default function InvoiceTemplateMock({
  template,
  accent,
  businessName,
  logoUrl,
  scale = 'full',
  clientName = 'Alex Rivera',
  serviceName = 'Full detail',
  serviceNote = 'Sedan · mobile',
  amount = 185,
}: InvoiceTemplateMockProps) {
  const amountLabel = fmt(amount)
  const doc = (
    <div
      className={`invoice-doc invoice-doc--${template}`}
      style={{ '--invoice-accent': accent } as CSSProperties}
    >
      <div className="invoice-doc-brand">
        <div className="invoice-doc-brand__logo">
          <BusinessLogo logoUrl={logoUrl} size={scale === 'thumbnail' ? 52 : 52} />
        </div>
        <div className="invoice-doc-brand__info">
          <div className="invoice-doc-brand__name">{businessName}</div>
          <div className="invoice-doc-brand__contact">hello@detail.co</div>
        </div>
      </div>

      <div className="invoice-doc-section invoice-doc-section--border">
        <div className="invoice-doc-meta">
          <div className="invoice-doc-meta__left">
            <div className="invoice-doc-section-label">Invoice</div>
            <div className="invoice-doc-meta__number">DET-2026-03-001</div>
            <div className="invoice-doc-meta__issued">Issued March 1, 2026</div>
          </div>
          <span
            className="invoice-doc-status-pill"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.10)', color: accent }}
          >
            SENT
          </span>
        </div>
      </div>

      <div className="invoice-doc-section invoice-doc-section--border">
        <div className="invoice-doc-section-label">Bill to</div>
        <div className="invoice-doc-bill-name">{clientName}</div>
      </div>

      <div className="invoice-doc-section">
        <div className="invoice-doc-lines-head">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="invoice-doc-line">
          <div className="invoice-doc-line__desc">
            <span>{serviceName}</span>
            <span className="invoice-doc-line__note">{serviceNote}</span>
          </div>
          <span className="invoice-doc-line__amount">{amountLabel}</span>
        </div>
        <div className="invoice-doc-totals">
          <div className="invoice-doc-totals__divider" />
          <div className="invoice-doc-totals__row invoice-doc-totals__row--grand">
            <span>Total</span>
            <span>{amountLabel}</span>
          </div>
        </div>
      </div>

      <div className="invoice-doc-footer-rinse">
        <p>Due on receipt. Thank you for your business.</p>
        <span className="invoice-doc-view-btn">View invoice online</span>
      </div>
    </div>
  )

  if (scale === 'thumbnail') {
    return (
      <div className="invoice-template-mock-wrap invoice-template-mock-wrap--thumb" aria-hidden="true">
        <div className="invoice-template-mock-scale">{doc}</div>
      </div>
    )
  }

  return doc
}
