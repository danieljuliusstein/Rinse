'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Plus } from '@phosphor-icons/react'
import { EmptyState, ListRow, SectionGroup } from '@/components/ui'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { getClient } from '@/lib/api'
import type { QuoteWithRelations } from '@/lib/types'

const FILTER_CHIPS: { key: 'all' | 'open' | 'accepted'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'accepted', label: 'Accepted' },
]

function quoteStatusForBadge(status: string): string {
  if (status === 'accepted') return 'paid'
  if (status === 'declined' || status === 'expired') return 'overdue'
  if (status === 'sent') return 'sent'
  return 'draft'
}

export default function QuotesList({ quotes }: { quotes: QuoteWithRelations[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientFilterId = searchParams.get('client')
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted'>('all')
  const [clientName, setClientName] = useState<string | null>(null)

  useEffect(() => {
    if (!clientFilterId) {
      setClientName(null)
      return
    }
    void getClient(clientFilterId).then((c) => setClientName(c?.name ?? null))
  }, [clientFilterId])

  const scopedQuotes = useMemo(
    () => (clientFilterId ? quotes.filter((q) => q.client_id === clientFilterId) : quotes),
    [quotes, clientFilterId]
  )

  const filtered = useMemo(() => {
    if (filter === 'accepted') return scopedQuotes.filter((q) => q.status === 'accepted')
    if (filter === 'open') return scopedQuotes.filter((q) => q.status === 'draft' || q.status === 'sent')
    return scopedQuotes
  }, [scopedQuotes, filter])

  const openCount = useMemo(
    () => scopedQuotes.filter((q) => q.status === 'draft' || q.status === 'sent').length,
    [scopedQuotes]
  )

  const newQuoteHref = clientFilterId
    ? `/quotes/new?clientId=${clientFilterId}`
    : '/quotes/new'

  return (
    <div className="screen page-content body quotes-screen">
      <header className="page-header">
        <div>
          <h1>{clientName ? `${clientName} quotes` : 'Quotes'}</h1>
          <p>
            {scopedQuotes.length} total
            {openCount > 0 && <> · {openCount} open</>}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn green"
          aria-label="New quote"
          onClick={() => router.push(newQuoteHref)}
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      {clientFilterId ? (
        <button
          type="button"
          className="chip active"
          style={{ marginBottom: 12 }}
          onClick={() => router.push('/quotes')}
        >
          Showing one client · Clear
        </button>
      ) : null}

      <div className="chips" role="tablist" aria-label="Quote filters">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={filter === chip.key}
            className={`chip${filter === chip.key ? ' active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          illustration="quotes"
          title={scopedQuotes.length === 0 ? 'No quotes yet' : 'No quotes match this filter'}
          description="Send a price estimate before booking the job."
          actionLabel="Create a quote"
          onAction={() => router.push(newQuoteHref)}
        />
      ) : (
        <SectionGroup title={clientName ? 'Quotes' : 'All quotes'}>
          {filtered.map((q) => (
            <ListRow
              key={q.id}
              icon={<FileText size={18} weight="duotone" />}
              iconTone="blue"
              title={q.quote_number}
              subtitle={`${q.client?.name ?? 'Unknown'} · ${q.package?.name ?? '—'}`}
              badgeStatus={quoteStatusForBadge(q.status)}
              trailing={<CurrencyAmount value={q.subtotal} variant="revenue" className="ui-list-row__amount" />}
              onClick={() => router.push(`/quotes/${q.id}`)}
            />
          ))}
        </SectionGroup>
      )}
    </div>
  )
}
