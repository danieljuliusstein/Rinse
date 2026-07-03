'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretDown, DownloadSimple, MagnifyingGlass, Plus, UploadSimple, Users } from '@phosphor-icons/react'
import AuthEmptyState from '@/components/AuthEmptyState'
import ClientCard from '@/components/clients/ClientCard'
import ClientImportSheet from '@/components/clients/ClientImportSheet'
import FollowUpClientCard from '@/components/clients/FollowUpClientCard'
import { EmptyState, VaulSheet } from '@/components/ui'
import { clientsToCsv, downloadCsv } from '@/lib/client-csv'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import {
  buildDerivedMap,
  filterBySegment,
  overdueClients,
  sortForSegment,
  topClientsByRevenue,
  type ClientSegment,
} from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

const SEGMENTS: { key: ClientSegment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'followup', label: 'Follow up' },
  { key: 'top', label: 'Top' },
  { key: 'new', label: 'New' },
]

type ClientSort = 'revenue' | 'name' | 'recent'

const SORT_OPTIONS: { key: ClientSort; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Last service' },
]

const CLIENTS_VISIBLE = 5

function matchesSearch(client: ClientWithStats, q: string): boolean {
  const lower = q.toLowerCase()
  return (
    client.name.toLowerCase().includes(lower) ||
    (client.phone?.includes(q) ?? false) ||
    (client.email?.toLowerCase().includes(lower) ?? false)
  )
}

function sortClients(list: ClientWithStats[], sort: ClientSort): ClientWithStats[] {
  const copy = [...list]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'recent') {
    return copy.sort((a, b) => (b.lastJobDate ?? '').localeCompare(a.lastJobDate ?? ''))
  }
  return copy.sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export default function ClientsList({
  clients,
  onClientRemoved,
}: {
  clients: ClientWithStats[]
  onClientRemoved?: (id: string) => void
}) {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<ClientSegment>('all')
  const [showAllRest, setShowAllRest] = useState(false)
  const [sort, setSort] = useState<ClientSort>('revenue')
  const [sortOpen, setSortOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const derivedMap = useMemo(() => buildDerivedMap(clients), [clients])
  const overdue = useMemo(() => overdueClients(clients, derivedMap), [clients, derivedMap])
  const topClients = useMemo(() => topClientsByRevenue(clients, 3), [clients])

  const filtered = useMemo(() => {
    const q = search.trim()
    let list = filterBySegment(clients, segment, derivedMap)
    list = sortForSegment(list, segment, derivedMap)
    if (q) list = list.filter((c) => matchesSearch(c, q))
    return sortClients(list, sort)
  }, [clients, segment, search, derivedMap, sort])

  const allRest = useMemo(() => {
    const topIds = new Set(topClients.map((c) => c.id))
    const overdueIds = new Set(overdue.map((c) => c.id))
    return clients
      .filter((c) => !topIds.has(c.id) && !overdueIds.has(c.id))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [clients, topClients, overdue])

  const visibleRest = showAllRest ? allRest : allRest.slice(0, CLIENTS_VISIBLE)
  const hiddenRest = allRest.length - visibleRest.length

  const renderSegmentList = () =>
    filtered.map((client) => {
      const derived = derivedMap.get(client.id)!
      return <ClientCard key={client.id} client={client} derived={derived} onClientRemoved={onClientRemoved} />
    })

  return (
    <div className="screen page-content body">
      <header className="page-header">
        <div>
          <h1>Clients</h1>
          <p>
            {isLoggedOut
              ? 'Sign in to load clients'
              : `${clients.length} client${clients.length !== 1 ? 's' : ''}${
                  overdue.length > 0 ? ` · ${overdue.length} need follow-up` : ''
                }`}
          </p>
        </div>
        {!isLoggedOut ? (
          <div className="page-header__actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Import clients"
              onClick={() => setImportOpen(true)}
            >
              <UploadSimple size={18} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Export clients CSV"
              onClick={() =>
                downloadCsv(
                  clientsToCsv(clients),
                  `clients-${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
            >
              <DownloadSimple size={18} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Add client"
              data-coach="clients-add"
              onClick={() => router.push('/clients/new')}
            >
              <Plus size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </header>

      <div className="search premium-search">
        <MagnifyingGlass size={16} className="premium-search__icon" aria-hidden="true" />
        <input
          className="premium-search__input"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search clients"
        />
      </div>

      <div className="chips" role="tablist" aria-label="Client filters" data-coach="clients-segments">
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={segment === s.key}
            className={`chip${segment === s.key ? ' active' : ''}`}
            onClick={() => setSegment(s.key)}
          >
            {s.label}
          </button>
        ))}
        {!isLoggedOut ? (
          <button type="button" className="chip chip--sort" onClick={() => setSortOpen(true)}>
            <CaretDown size={14} aria-hidden="true" />
            {SORT_OPTIONS.find((o) => o.key === sort)?.label}
          </button>
        ) : null}
      </div>

      <VaulSheet open={sortOpen} onOpenChange={setSortOpen} title="Sort by">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`vaul-option${sort === opt.key ? ' vaul-option--active' : ''}`}
            onClick={() => {
              setSort(opt.key)
              setSortOpen(false)
            }}
          >
            {opt.label}
            {sort === opt.key ? ' ✓' : ''}
          </button>
        ))}
      </VaulSheet>

      {isLoggedOut ? (
        <AuthEmptyState
          icon={<Users size={26} weight="duotone" />}
          title="Sign in to see your clients"
          subtitle="Your client list and history sync after you sign in."
        />
      ) : (
        <div data-coach="clients-list">
          {segment !== 'all' ? (
            filtered.length === 0 ? (
              <EmptyState title="No clients found" description="Try another segment or search term." />
            ) : (
              renderSegmentList()
            )
          ) : (
            <>
              {overdue.length > 0 && (
                <>
                  <p className="sec">Follow up</p>
                  {overdue.map((client) => (
                    <FollowUpClientCard key={client.id} client={client} />
                  ))}
                </>
              )}

              {topClients.length > 0 && (
                <>
                  <p className="sec">Top clients</p>
                  {topClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      derived={derivedMap.get(client.id)!}
                      onClientRemoved={onClientRemoved}
                    />
                  ))}
                </>
              )}

              {allRest.length > 0 && (
                <>
                  <p className="sec">All clients</p>
                  {visibleRest.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      derived={derivedMap.get(client.id)!}
                      onClientRemoved={onClientRemoved}
                    />
                  ))}
                  {hiddenRest > 0 && (
                    <button type="button" className="more-pill" onClick={() => setShowAllRest(true)}>
                      + {hiddenRest} more client{hiddenRest > 1 ? 's' : ''}
                    </button>
                  )}
                </>
              )}

              {clients.length === 0 && (
                <EmptyState
                  icon={<Users size={80} weight="duotone" />}
                  title="No clients yet"
                  description="Add your first client to start booking jobs."
                  actionLabel="Add client"
                  onAction={() => router.push('/clients/new')}
                />
              )}
            </>
          )}
        </div>
      )}

      <ClientImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => window.location.reload()}
      />
    </div>
  )
}
