import { useMemo, useState, type MouseEvent } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { money } from '@/lib/metrics'
import type { DeskInvoice } from '@/lib/types'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

const PAID = '#1D9E75'
const DUE_SOON = '#EF9F27'
const OVERDUE = '#E24B4A'

type SegKey = 'paid' | 'dueSoon' | 'overdue'

type Props = {
  invoices: DeskInvoice[]
  onOpen?: () => void
  onOpenPaid?: () => void
  onOpenDueSoon?: () => void
  onOpenOverdue?: () => void
  onSendReminders?: () => void
}

export function InvoiceCollectionCard({
  invoices,
  onOpen,
  onOpenPaid,
  onOpenDueSoon,
  onOpenOverdue,
  onSendReminders,
}: Props) {
  const [hover, setHover] = useState<SegKey | null>(null)

  const stats = useMemo(() => {
    const collectible = invoices.filter(
      (i) => i.sent_at || i.status === 'sent' || i.status === 'paid' || i.status === 'overdue' || i.status === 'partial',
    )
    const paidAmt = collectible
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.total, 0)
    const overdueInvs = collectible.filter((i) => i.status === 'overdue')
    const overdueAmt = overdueInvs.reduce(
      (s, i) => s + Math.max(i.balance_due, i.total - i.amount_paid),
      0,
    )
    const dueSoonAmt = collectible
      .filter((i) => i.status === 'sent' || i.status === 'partial')
      .reduce((s, i) => s + Math.max(i.balance_due, i.total - i.amount_paid), 0)
    const total = paidAmt + dueSoonAmt + overdueAmt
    const pct = total > 0 ? Math.round((paidAmt / total) * 100) : 0
    return {
      paidAmt,
      dueSoonAmt,
      overdueAmt,
      total,
      pct,
      overdueCount: overdueInvs.length,
    }
  }, [invoices])

  function segWidth(amt: number) {
    if (stats.total <= 0) return 0
    return Math.max((amt / stats.total) * 100, amt > 0 ? 2 : 0)
  }

  function go(key: SegKey, e?: MouseEvent) {
    e?.stopPropagation()
    if (key === 'paid') onOpenPaid?.() ?? onOpen?.()
    else if (key === 'dueSoon') onOpenDueSoon?.() ?? onOpen?.()
    else onOpenOverdue?.() ?? onSendReminders?.() ?? onOpen?.()
  }

  const segs: { key: SegKey; amt: number; color: string; label: string }[] = [
    { key: 'paid', amt: stats.paidAmt, color: PAID, label: 'Paid' },
    { key: 'dueSoon', amt: stats.dueSoonAmt, color: DUE_SOON, label: 'Due soon' },
    { key: 'overdue', amt: stats.overdueAmt, color: OVERDUE, label: 'Overdue' },
  ]

  return (
    <WidgetCard onOpen={onOpen} className="w-full !p-3 gap-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Invoice Collection
      </p>

      <div className="flex items-baseline gap-2">
        <span
          className="text-[28px] font-medium text-gray-900 leading-none tabular-nums"
          style={{ fontFamily: "'Newsreader', 'Fraunces', Georgia, serif" }}
        >
          {stats.pct}%
        </span>
        <span className="text-[11px] text-gray-500 leading-snug">
          of {money(stats.total)} invoiced collected to date
        </span>
      </div>

      <div
        className="flex gap-0.5 h-3 rounded-full"
        style={{ background: stats.total <= 0 ? '#F1EFE8' : 'transparent' }}
        onClick={stopCardClick}
      >
        {segs
          .filter((s) => s.amt > 0)
          .map((s) => (
            <div key={s.key} className="h-full" style={{ width: `${segWidth(s.amt)}%` }}>
              <Tip label={`${s.label} · ${money(s.amt)}`} className="h-full w-full block">
                <button
                  type="button"
                  aria-label={`${s.label}: ${money(s.amt)}`}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                  onClick={(e) => go(s.key, e)}
                  className="h-full w-full rounded-full transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    background: s.color,
                    opacity: hover && hover !== s.key ? 0.45 : 1,
                    transform: hover === s.key ? 'scaleY(1.12)' : undefined,
                  }}
                />
              </Tip>
            </div>
          ))}
      </div>

      <div className="flex flex-col gap-1.5 mt-auto" onClick={stopCardClick}>
        <div className="flex gap-2 flex-wrap">
          {segs.map((s) => (
            <button
              key={s.key}
              type="button"
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              onClick={(e) => go(s.key, e)}
              className="text-[11px] text-gray-700 inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-green-200"
              style={{ background: hover === s.key ? `${s.color}18` : undefined }}
            >
              <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: s.color }} />
              {s.label} {money(s.amt)}
            </button>
          ))}
        </div>

        {stats.overdueCount > 0 && (
          <button
            type="button"
            className="flex items-center justify-between w-full rounded-md px-2 py-1 transition-colors hover:brightness-[0.98]"
            style={{ background: '#FCEBEB' }}
            onClick={(e) => {
              stopCardClick(e)
              onSendReminders?.()
            }}
          >
            <span className="text-[11px] inline-flex items-center gap-1.5" style={{ color: '#791F1F' }}>
              <IconAlertTriangle size={12} stroke={1.75} aria-hidden />
              {stats.overdueCount} invoice{stats.overdueCount === 1 ? '' : 's'} overdue
            </span>
            <span className="text-[11px] font-medium" style={{ color: '#791F1F' }}>
              Send reminders →
            </span>
          </button>
        )}
      </div>
    </WidgetCard>
  )
}
