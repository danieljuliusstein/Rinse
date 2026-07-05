'use client'

import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import BusinessLogo from '@/components/BusinessLogo'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  buildInvoiceViewModel,
  formatInvoiceMoney,
  type InvoiceViewModel,
} from '@/lib/invoice-layout'
import { openPortalLink } from '@/lib/portal-client'
import { normalizeAccentColor } from '@/lib/brand-color'
import type { AppSettings } from '@/lib/settings'
import type { Invoice, JobWithRelations } from '@/lib/types'

interface InvoiceDocumentBodyProps {
  job: JobWithRelations
  invoice: Invoice
  settings: AppSettings
  portalUrl?: string
}

const STATUS_STYLES: Record<
  InvoiceViewModel['statusTone'],
  { bg: string; color: string }
> = {
  draft: { bg: '#f4f4f4', color: '#888888' },
  sent: { bg: 'rgba(34, 197, 94, 0.10)', color: '#22c55e' },
  paid: { bg: 'rgba(34, 197, 94, 0.10)', color: '#22c55e' },
  overdue: { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444' },
  partial: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="invoice-doc-kv">
      <span className="invoice-doc-kv__label">{label}</span>
      <span className="invoice-doc-kv__value">{value}</span>
    </div>
  )
}

export default function InvoiceDocumentBody({
  job,
  invoice,
  settings,
  portalUrl,
}: InvoiceDocumentBodyProps) {
  const router = useRouter()
  const vm = buildInvoiceViewModel(job, invoice, settings, { portalUrl })
  const statusStyle = STATUS_STYLES[vm.statusTone]
  const clientAddressParts = [vm.billToAddress].filter(Boolean) as string[]
  const template = settings.invoice_template ?? 'rinse'
  const accent = normalizeAccentColor(settings.accent_color)

  return (
    <div
      className={`invoice-doc invoice-doc--${template}`}
      style={{ '--invoice-accent': accent } as CSSProperties}
    >
      <div className="invoice-doc-brand">
        <div className="invoice-doc-brand__logo">
          <BusinessLogo logoUrl={vm.logoUrl} size={52} />
        </div>
        <div className="invoice-doc-brand__info">
          <div className="invoice-doc-brand__name">{vm.businessName}</div>
          {vm.businessEmail && <div className="invoice-doc-brand__contact">{vm.businessEmail}</div>}
          {vm.businessPhone && <div className="invoice-doc-brand__contact">{vm.businessPhone}</div>}
        </div>
      </div>

      <div className="invoice-doc-section invoice-doc-section--border">
        <div className="invoice-doc-meta">
          <div className="invoice-doc-meta__left">
            <div className="invoice-doc-section-label">Invoice</div>
            <div className="invoice-doc-meta__number">{vm.invoiceNumber}</div>
            <div className="invoice-doc-meta__issued">Issued {vm.issuedDateLabel}</div>
            {vm.poNumber ? <div className="invoice-doc-meta__po">PO {vm.poNumber}</div> : null}
          </div>
          <span
            className="invoice-doc-status-pill"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
          >
            {vm.statusLabel}
          </span>
        </div>
      </div>

      <div className="invoice-doc-section invoice-doc-section--border">
        <div className="invoice-doc-section-label">Bill to</div>
        <div className="invoice-doc-bill-name">{vm.billToName}</div>
        {clientAddressParts.length > 0 && (
          <div className="invoice-doc-bill-address">{clientAddressParts.join(' · ')}</div>
        )}
      </div>

      <div className="invoice-doc-section invoice-doc-section--border">
        <div className="invoice-doc-section-label">Service details</div>
        <div className="invoice-doc-kv-list">
          <KVRow label="Date" value={vm.serviceDateLabel} />
          <KVRow label="Vehicle" value={vm.vehicleLabel} />
          <KVRow label="Location" value={vm.locationLabel} />
        </div>
      </div>

      <div className="invoice-doc-section">
        <div className="invoice-doc-lines-head">
          <span>Description</span>
          <span>Amount</span>
        </div>

        {vm.lineItems.map((item, i) => (
          <div key={i} className="invoice-doc-line">
            <div className="invoice-doc-line__desc">
              <span>{item.description}</span>
              {item.note && <span className="invoice-doc-line__note">{item.note}</span>}
            </div>
            <span className="invoice-doc-line__amount">{formatInvoiceMoney(item.amount)}</span>
          </div>
        ))}

        <div className="invoice-doc-totals">
          <div className="invoice-doc-totals__row">
            <span className="invoice-doc-totals__muted">Subtotal</span>
            <span>{formatInvoiceMoney(vm.subtotal)}</span>
          </div>
          {vm.showTip && (
            <div className="invoice-doc-totals__row">
              <span className="invoice-doc-totals__muted">Tip</span>
              <span>{formatInvoiceMoney(vm.tip)}</span>
            </div>
          )}
          {vm.showDiscount && vm.discount != null && (
            <div className="invoice-doc-totals__row">
              <span className="invoice-doc-totals__muted">Discount</span>
              <span>-{formatInvoiceMoney(vm.discount)}</span>
            </div>
          )}
          {vm.showTax && vm.taxAmount != null && (
            <div className="invoice-doc-totals__row">
              <span className="invoice-doc-totals__muted">
                Tax{vm.taxRate ? ` (${vm.taxRate}%)` : ''}
              </span>
              <span>{formatInvoiceMoney(vm.taxAmount)}</span>
            </div>
          )}
          <div className="invoice-doc-totals__divider" />
          <div className="invoice-doc-totals__row invoice-doc-totals__row--grand">
            <span>Total</span>
            <CurrencyAmount value={vm.total} precision="detailed" variant="neutral" />
          </div>
          <div className="invoice-doc-totals__row">
            <span className="invoice-doc-totals__muted">Balance due</span>
            <CurrencyAmount
              value={vm.balanceDue}
              variant={vm.balanceDue > 0 ? 'expense' : 'revenue'}
              unsigned={vm.balanceDue >= 0}
            />
          </div>
        </div>
      </div>

      {vm.showPayments && (
        <div className="invoice-doc-section invoice-doc-section--border">
          <div className="invoice-doc-section-label">Payments</div>
          {vm.payments.map((p, i) => (
            <div key={i} className="invoice-doc-totals__row">
              <span className="invoice-doc-totals__muted">
                {p.method} · {p.date}
              </span>
              <CurrencyAmount value={p.amount} variant="revenue" />
            </div>
          ))}
        </div>
      )}

      {vm.showSignature && vm.signatureUrl ? (
        <div className="invoice-doc-section invoice-doc-section--border invoice-doc-signature">
          <div className="invoice-doc-section-label">Client signature</div>
          {vm.signedAtLabel ? (
            <p className="invoice-doc-signature__date">Signed {vm.signedAtLabel}</p>
          ) : null}
          <img src={vm.signatureUrl} alt="Client signature" className="invoice-doc-signature__image" />
        </div>
      ) : null}

      <div className="invoice-doc-footer-rinse">
        {vm.termsFooter ? (
          <div className="rinse-prose invoice-doc-terms">
            <p>{vm.termsFooter}</p>
          </div>
        ) : null}
        {vm.questionsLine && <p>{vm.questionsLine}</p>}
        {vm.portalUrl && (
          <a
            href={vm.portalUrl}
            className="invoice-doc-view-btn"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              openPortalLink(vm.portalUrl!, router.push)
            }}
          >
            View invoice online
          </a>
        )}
      </div>
    </div>
  )
}
