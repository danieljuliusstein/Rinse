import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Mail,
  Pencil,
  Send,
  Trash2,
  User,
} from 'lucide-react'
import type { DeskQuote, QuoteStatus } from '@/lib/types'
import { money } from '@/lib/metrics'

const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft: 'bg-ink-100 text-ink-600',
  sent: 'bg-sky-50 text-sky-700',
  accepted: 'bg-brand-50 text-brand-700',
  declined: 'bg-rose-50 text-rose-700',
  expired: 'bg-ink-100 text-ink-400',
}

type Props = {
  quote: DeskQuote
  clientName: string
  packageName?: string
  expanded: boolean
  busy?: boolean
  onToggle: () => void
  onEdit: () => void
  onMarkSent: () => void
  onAccept: () => void
  onDelete: () => void
  onOpenPdf: () => void
  onCopyPortal: () => void
  onEmail: () => void
}

export function QuoteRow({
  quote,
  clientName,
  packageName,
  expanded,
  busy,
  onToggle,
  onEdit,
  onMarkSent,
  onAccept,
  onDelete,
  onOpenPdf,
  onCopyPortal,
  onEmail,
}: Props) {
  const status = quote.status
  const canSend = status === 'draft'
  const canAccept = status === 'draft' || status === 'sent'
  const canDelete = status !== 'accepted'

  return (
    <div className="rounded-xl bg-white ring-1 ring-ink-200/80 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-ink-50/60 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-ink-900 truncate">{clientName}</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}
            >
              {status}
            </span>
          </div>
          <div className="text-[12px] text-ink-500 mt-0.5 truncate">
            {quote.quote_number || 'Draft'}
            {packageName ? ` · ${packageName}` : ''}
            {quote.date ? ` · ${quote.date}` : ''}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15px] font-semibold tabular-nums text-ink-900">
            {money(quote.subtotal)}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-ink-400 shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded ? (
        <div className="px-4 pb-4 pt-1 border-t border-ink-100">
          {quote.notes ? (
            <p className="text-[12.5px] text-ink-600 mb-3 leading-relaxed">{quote.notes}</p>
          ) : null}
          <div className="flex items-center gap-2 flex-wrap">
            {canSend ? (
              <button
                type="button"
                disabled={busy}
                onClick={onMarkSent}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-ink-900 text-white text-[12.5px] font-semibold hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {busy ? 'Working…' : 'Mark sent'}
              </button>
            ) : null}
            {canAccept ? (
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-500 text-brand-900 text-[12.5px] font-semibold hover:bg-brand-600 hover:text-white transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accept → job
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
            {canDelete ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-rose-600 text-[12.5px] font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : null}
            <div className="flex-1" />
            <span className="text-[11px] text-ink-400 flex items-center gap-1">
              <User className="w-3 h-3" /> Shared with mobile
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
