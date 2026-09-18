import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Mail,
  Pencil,
  Send,
  User,
} from 'lucide-react'
import type { DeskInvoice } from '@/lib/types'
import { money } from '@/lib/metrics'
import { StatusChip } from './StatusChip'

function formatShortDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  inv: DeskInvoice
  clientName: string
  service?: string
  expanded: boolean
  busy?: boolean
  onToggle: () => void
  onEdit: () => void
  onMarkSent: () => void
  onMarkPaid: () => void
  onOpenPdf: () => void
  onCopyPortal: () => void
  onEmail: () => void
}

export function InvoiceRow({
  inv,
  clientName,
  service,
  expanded,
  busy,
  onToggle,
  onEdit,
  onMarkSent,
  onMarkPaid,
  onOpenPdf,
  onCopyPortal,
  onEmail,
}: Props) {
  const due = inv.balance_due
  const status = inv.status

  return (
    <div className={`group ${expanded ? 'bg-ink-50' : 'hover:bg-ink-50'} transition-colors`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <ChevronRight
          className={`w-4 h-4 text-ink-400 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-ink-200 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-ink-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-ink-900 truncate">{clientName}</span>
            <StatusChip status={status} />
          </div>
          <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-ink-600">{inv.invoice_number}</span>
            <span className="text-ink-300">·</span>
            <span>{formatShortDate(inv.sent_at ?? inv.created)}</span>
            {service ? (
              <>
                <span className="text-ink-300">·</span>
                <span className="truncate">{service}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0 w-28">
          <div className="font-semibold text-[14px] text-ink-900 tabular-nums">{money(inv.total)}</div>
          {due > 0 && status !== 'paid' ? (
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Due {money(due)}</div>
          ) : null}
          {status === 'paid' ? (
            <div className="text-[11px] text-brand-600 font-semibold mt-0.5">Settled</div>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="px-4 pb-4 pt-1 animate-invoices-row-expand">
          <div className="bg-white rounded-xl ring-1 ring-ink-200/80 shadow-sm p-4">
            <div className="flex items-start gap-4 pb-4 border-b border-ink-100">
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ink-900">
                  {service || 'Detailing invoice'}
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 mt-2.5 text-[12px]">
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Invoice
                    </div>
                    <div className="text-ink-700 font-medium">{inv.invoice_number}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Sent
                    </div>
                    <div className="text-ink-700 font-medium">{formatShortDate(inv.sent_at)}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Paid
                    </div>
                    <div className="text-ink-700 font-medium">{formatShortDate(inv.paid_at)}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Total
                    </div>
                    <div className="text-ink-700 font-medium tabular-nums">{money(inv.total)}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Amount paid
                    </div>
                    <div className="text-ink-700 font-medium tabular-nums">{money(inv.amount_paid)}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-[10px] uppercase tracking-wide font-semibold">
                      Tip
                    </div>
                    <div className="text-ink-700 font-medium tabular-nums">{money(inv.tip)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 flex-wrap">
              {status === 'draft' ? (
                <button
                  type="button"
                  disabled={busy}
                  data-tour-target="invoices-send"
                  onClick={onMarkSent}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-ink-900 text-white text-[12.5px] font-semibold hover:bg-ink-800 transition-colors shadow-sm disabled:opacity-50 relative z-[55] pointer-events-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  {busy ? 'Working…' : 'Mark sent'}
                </button>
              ) : null}
              {due > 0 && status !== 'paid' && status !== 'void' && status !== 'cancelled' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onMarkPaid}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-500 text-brand-900 text-[12.5px] font-semibold hover:bg-brand-600 hover:text-white transition-colors shadow-sm shadow-brand-500/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {busy ? 'Working…' : 'Mark paid'}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white ring-1 ring-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onOpenPdf}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white ring-1 ring-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onCopyPortal}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white ring-1 ring-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy link
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onEmail}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white ring-1 ring-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <div className="flex-1" />
              <span className="text-[11px] text-ink-400 flex items-center gap-1">
                <User className="w-3 h-3" /> Shared with mobile
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
