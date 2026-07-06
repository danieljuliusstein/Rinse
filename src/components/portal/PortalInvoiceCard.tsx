import type { PortalPayload } from '@/lib/server/portal-data'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  portalBalancePanelClass,
  portalInvoiceBadgeClass,
  portalMoney,
} from '@/lib/portal-display'
import PortalPayButton from './PortalPayButton'
import PortalInvoiceSignature from './PortalInvoiceSignature'

export default function PortalInvoiceCard({
  invoice,
  job,
  token,
  showPayOnline = false,
  businessPhone,
  businessName,
}: {
  invoice: NonNullable<PortalPayload['invoice']>
  job?: PortalPayload['job']
  token?: string
  showPayOnline?: boolean
  businessPhone?: string
  businessName?: string
}) {
  const balanceVariant = portalBalancePanelClass(invoice.status, invoice.balanceDue)
  const lineDesc = job?.packageName ?? 'Detailing service'
  const canPay = showPayOnline && invoice.balanceDue > 0 && token

  return (
    <div className="portal-card portal-card--invoice">
      <div className="portal-card-inner">
        <div className="portal-card-header-row">
          <div className="portal-section-label portal-section-label--flush">
            Invoice
          </div>
          <span className={portalInvoiceBadgeClass(invoice.status)}>
            {invoice.status === 'paid' || invoice.balanceDue <= 0 ? 'PAID' : invoice.status.toUpperCase()}
          </span>
        </div>
        <div className="portal-inv-number">{invoice.invoiceNumber}</div>

        <table className="portal-invoice-table">
          <thead>
            <tr>
              <th className="portal-invoice-table__head">Description</th>
              <th className="portal-invoice-table__head portal-invoice-table__head--amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="portal-line-desc">{lineDesc}</td>
              <td className="portal-line-amt">{portalMoney(invoice.subtotal)}</td>
            </tr>
            {invoice.tip > 0 && (
              <tr>
                <td className="portal-line-desc portal-line-desc--sub">Tip</td>
                <td className="portal-line-amt portal-line-amt--sub">{portalMoney(invoice.tip)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr className="portal-invoice-divider" />

        <div className="portal-total-row">
          <span className="portal-total-label">Subtotal</span>
          <span className="portal-total-amount">{portalMoney(invoice.subtotal)}</span>
        </div>
        {invoice.tip > 0 && (
          <div className="portal-total-row">
            <span className="portal-total-label">Tip</span>
            <span className="portal-total-amount">{portalMoney(invoice.tip)}</span>
          </div>
        )}
        <div className="portal-total-row portal-total-border-row">
          <span className="portal-total-label--strong">Total</span>
          <span className="portal-total-amount portal-total-amount--grand">
            <CurrencyAmount value={invoice.total} precision="detailed" variant="neutral" />
          </span>
        </div>
        {invoice.amountPaid > 0 && (
          <div className="portal-total-row">
            <span className="portal-total-label">Paid</span>
            <span className="portal-total-amount portal-total-amount--credit">
              {portalMoney(invoice.amountPaid)}
            </span>
          </div>
        )}

        {balanceVariant && (
          <div className={`portal-balance-panel portal-balance-panel--${balanceVariant}`}>
            <span className="portal-balance-label">Balance due</span>
            <span className="portal-balance-amount">
              <CurrencyAmount value={invoice.balanceDue} precision="detailed" variant="balance" />
            </span>
          </div>
        )}

        {canPay ? (
          <PortalPayButton
            token={token}
            balanceDue={invoice.balanceDue}
            businessPhone={businessPhone}
            businessName={businessName}
          />
        ) : null}

        {token ? (
          <PortalInvoiceSignature
            token={token}
            signatureUrl={invoice.signatureUrl}
            signedAt={invoice.signedAt}
          />
        ) : null}
      </div>
    </div>
  )
}
