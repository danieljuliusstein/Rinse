'use client'

import { useCallback, useMemo, useOptimistic, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass, Receipt } from '@phosphor-icons/react'
import ConfirmSheet from '@/components/ConfirmSheet'
import InvoiceListContextMenu from '@/components/invoice/InvoiceListContextMenu'
import InvoiceSwipeableRow from '@/components/invoice/InvoiceSwipeableRow'
import {
  Badge,
  EmptyState,
  ListRow,
  SectionGroup,
  VirtualList,
} from '@/components/ui'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { useDetailNavigation } from '@/hooks/useDetailNavigation'
import {
  deleteInvoice,
  duplicateInvoice,
  getInvoices,
  markInvoicePaid,
  markInvoiceSent,
} from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { notifyFinancialDataChanged } from '@/lib/financial-data-events'
import { AGING_LABELS, agingBucket, summarizeAging, type AgingBucket } from '@/lib/invoice-aging'
import {
  optimisticInvoiceReducer,
  type InvoiceOptimisticAction,
} from '@/lib/optimistic-reducers'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client, Invoice } from '@/lib/types'

type FilterKey = 'all' | 'open' | 'paid' | 'overdue' | 'draft'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'draft', label: 'Draft' },
]

const AGING_BUCKETS: AgingBucket[] = ['1-30', '31-60', '60+']

type FlatRow =
  | { kind: 'section'; key: string; label: string; total: number }
  | { kind: 'invoice'; inv: Invoice }
  | { kind: 'section-total'; key: string; total: number; balanceDue: number }

function parseFilter(value: string | null): FilterKey {
  if (value === 'open' || value === 'paid' || value === 'overdue' || value === 'draft') return value
  return 'all'
}

function invoiceDate(inv: Invoice): string {
  return inv.sent_at ?? inv.paid_at ?? '1970-01-01'
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

interface Props {
  invoices: Invoice[]
  clients: Client[]
}

export default function InvoicesList({ invoices: initialInvoices, clients }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showMessage, handleWriteError } = useActionToast()
  const { openInvoice } = useDetailNavigation()
  const initialFilter = parseFilter(searchParams.get('filter'))
  const [invoices, setInvoices] = useState(initialInvoices)
  const [optimisticInvoices, addOptimistic] = useOptimistic(invoices, (state, action: InvoiceOptimisticAction) =>
    optimisticInvoiceReducer(state, action),
  )
  const [filter, setFilter] = useState<FilterKey>(initialFilter)
  const [agingFilter, setAgingFilter] = useState<AgingBucket | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedSearch(search)
  const [menuInvoice, setMenuInvoice] = useState<Invoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [swipedRowId, setSwipedRowId] = useState<string | null>(null)

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const aging = useMemo(() => summarizeAging(optimisticInvoices), [optimisticInvoices])

  const reload = useCallback(async () => {
    const next = await getInvoices()
    setInvoices(next)
    notifyFinancialDataChanged()
  }, [])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return optimisticInvoices.filter((inv) => {
      if (filter === 'paid' && inv.status !== 'paid') return false
      if (filter === 'draft' && inv.status !== 'draft') return false
      if (filter === 'overdue' && inv.status !== 'overdue') return false
      if (filter === 'open' && (inv.status === 'paid' || inv.status === 'draft')) return false
      if (agingFilter && agingBucket(inv) !== agingFilter) return false
      if (!q) return true
      const client = clientMap.get(inv.client_id)
      return (
        inv.invoice_number.toLowerCase().includes(q) ||
        (client?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [optimisticInvoices, filter, debouncedSearch, clientMap, agingFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Invoice[]>()
    for (const inv of filtered) {
      const key = monthKey(invoiceDate(inv))
      const list = map.get(key) ?? []
      list.push(inv)
      map.set(key, list)
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => ({
        key,
        label: monthLabel(key),
        invoices: [...list].sort(
          (a, b) => new Date(invoiceDate(b)).getTime() - new Date(invoiceDate(a)).getTime(),
        ),
        total: list.reduce((s, i) => s + i.total, 0),
        balanceDue: list.reduce((s, i) => s + i.balance_due, 0),
      }))
  }, [filtered])

  const flatRows = useMemo((): FlatRow[] => {
    const rows: FlatRow[] = []
    for (const section of grouped) {
      rows.push({ kind: 'section', key: section.key, label: section.label, total: section.total })
      for (const inv of section.invoices) {
        rows.push({ kind: 'invoice', inv })
      }
      rows.push({
        kind: 'section-total',
        key: `${section.key}-total`,
        total: section.total,
        balanceDue: section.balanceDue,
      })
    }
    return rows
  }, [grouped])

  const runOptimistic = useCallback(
    async (action: InvoiceOptimisticAction, apiFn: () => Promise<void>) => {
      addOptimistic(action)
      try {
        await apiFn()
        await reload()
      } catch (err) {
        if (handleWriteError(err)) {
          await reload()
          return
        }
        showMessage(err instanceof Error ? err.message : 'Update failed')
        await reload()
      }
    },
    [addOptimistic, handleWriteError, reload, showMessage],
  )

  const renderInvoiceRow = (inv: Invoice) => {
    const client = clientMap.get(inv.client_id)
    const canMarkSent = inv.status === 'draft'
    const canMarkPaid = inv.balance_due > 0
    return (
      <InvoiceSwipeableRow
        key={inv.id}
        rowId={inv.id}
        openRowId={swipedRowId}
        onOpenChange={setSwipedRowId}
        canMarkSent={canMarkSent}
        canMarkPaid={canMarkPaid}
        onLongPress={() => setMenuInvoice(inv)}
        onMarkSent={
          canMarkSent
            ? () =>
                void runOptimistic({ type: 'markSent', id: inv.id }, async () => {
                  await markInvoiceSent(inv.id)
                })
            : undefined
        }
        onMarkPaid={
          canMarkPaid
            ? () =>
                void runOptimistic({ type: 'markPaid', id: inv.id }, async () => {
                  await markInvoicePaid(inv.id, 'Cash')
                })
            : undefined
        }
        onDuplicate={() =>
          void (async () => {
            try {
              await duplicateInvoice(inv.id)
              await reload()
            } catch (err) {
              if (handleWriteError(err)) return
              showMessage(err instanceof Error ? err.message : 'Could not duplicate')
            }
          })()
        }
        onDelete={() => setDeleteTarget(inv)}
      >
        <ListRow
          icon={<Receipt size={20} weight="duotone" />}
          iconTone="blue"
          title={client?.name ?? 'Unknown client'}
          subtitle={inv.invoice_number}
          badgeStatus={inv.status}
          amount={fmt(inv.total)}
          trailing={
            inv.balance_due > 0 ? (
              <span className="currency--expense invoices-due">{fmt(inv.balance_due)} due</span>
            ) : (
              <Badge tone="green">Paid</Badge>
            )
          }
          onClick={() => openInvoice(inv.job_id)}
          morphLayoutId={`invoice-${inv.id}`}
        />
      </InvoiceSwipeableRow>
    )
  }

  const renderFlatRow = (row: FlatRow) => {
    if (row.kind === 'section') {
      return (
        <div className="ui-section virtual-list__section-header">
          <div className="ui-section__head">
            <h2 className="ui-section__title">{row.label}</h2>
            <span className="ui-section__meta">{fmt(row.total)}</span>
          </div>
        </div>
      )
    }
    if (row.kind === 'section-total') {
      return (
        <ListRow
          title="Total"
          subtitle="Balance due"
          amount={fmt(row.total)}
          trailing={
            <span
              className={
                row.balanceDue > 0 ? 'currency--expense invoices-due-total' : 'currency--revenue'
              }
            >
              {fmt(row.balanceDue)}
            </span>
          }
        />
      )
    }
    return renderInvoiceRow(row.inv)
  }

  return (
    <div className="screen page-content body screen--dock-nav invoices-screen">
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>{optimisticInvoices.length} total</p>
        </div>
        <button type="button" className="page-header__action" data-coach="invoices-new" onClick={() => router.push('/invoices/new')}>
          New
        </button>
      </header>

      <div className="premium-search invoices-search" data-coach="invoices-search">
        <MagnifyingGlass size={16} className="premium-search__icon" aria-hidden="true" />
        <input
          className="premium-search__input"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search invoices"
        />
      </div>

      <div className="chips invoices-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`chip${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(filter === 'open' || filter === 'overdue') && (
        <div className="invoices-aging">
          {AGING_BUCKETS.map((bucket) => {
            const data = aging[bucket]
            if (data.count === 0) return null
            return (
              <button
                key={bucket}
                type="button"
                className={`invoices-aging__chip${agingFilter === bucket ? ' invoices-aging__chip--on' : ''}`}
                onClick={() => setAgingFilter(agingFilter === bucket ? null : bucket)}
              >
                <span>{AGING_LABELS[bucket]}</span>
                <strong>{fmt(data.amount)}</strong>
                <span className="invoices-aging__count">{data.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          illustration="invoices"
          title="No invoices found"
          description={
            filter === 'all' && !search
              ? 'Create an invoice from a completed job or use quick actions.'
              : 'Try a different filter or search term.'
          }
          actionLabel={filter === 'all' && !search ? 'Create invoice' : undefined}
          onAction={filter === 'all' && !search ? () => router.push('/invoices/new') : undefined}
        />
      ) : flatRows.length > 50 ? (
        <VirtualList
          items={flatRows}
          estimateSize={72}
          getItemKey={(row) =>
            row.kind === 'invoice' ? row.inv.id : row.kind === 'section' ? row.key : row.key
          }
          renderItem={(row) => renderFlatRow(row)}
        />
      ) : (
        grouped.map((section) => (
          <SectionGroup key={section.key} title={section.label} meta={fmt(section.total)}>
            {section.invoices.map((inv) => renderInvoiceRow(inv))}
            <ListRow
              title="Total"
              subtitle="Balance due"
              amount={fmt(section.total)}
              trailing={
                <span
                  className={
                    section.balanceDue > 0 ? 'currency--expense invoices-due-total' : 'currency--revenue'
                  }
                >
                  {fmt(section.balanceDue)}
                </span>
              }
            />
          </SectionGroup>
        ))
      )}

      {menuInvoice ? (
        <InvoiceListContextMenu
          canMarkSent={menuInvoice.status === 'draft'}
          canMarkPaid={menuInvoice.balance_due > 0}
          onView={() => router.push(`/jobs/${menuInvoice.job_id}/invoice`)}
          onMarkSent={() =>
            void runOptimistic({ type: 'markSent', id: menuInvoice.id }, async () => {
              await markInvoiceSent(menuInvoice.id)
            })
          }
          onMarkPaid={() =>
            void runOptimistic({ type: 'markPaid', id: menuInvoice.id }, async () => {
              await markInvoicePaid(menuInvoice.id, 'Cash')
            })
          }
          onDuplicate={() =>
            void (async () => {
              try {
                await duplicateInvoice(menuInvoice.id)
                await reload()
              } catch (err) {
                if (handleWriteError(err)) return
                showMessage(err instanceof Error ? err.message : 'Could not duplicate')
              }
            })()
          }
          onDelete={() => setDeleteTarget(menuInvoice)}
          onClose={() => setMenuInvoice(null)}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmSheet
          title="Delete invoice?"
          message={`Remove ${deleteTarget.invoice_number}? The job will no longer be linked.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            const id = deleteTarget.id
            setDeleteTarget(null)
            setMenuInvoice(null)
            void runOptimistic({ type: 'remove', id }, async () => {
              await deleteInvoice(id)
            })
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  )
}
