import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import * as api from '@/lib/api'
import { money, todayISO } from '@/lib/metrics'
import { sumLineAmounts } from '@/lib/invoice-edit'
import {
  copyTextToClipboard,
  createPortalLink,
  downloadQuotePdf,
  isValidContactEmail,
  sendDocumentLink,
  shareErrorMessage,
} from '@/lib/document-share'
import { getCachedBusinessName } from '@/lib/business-brand'
import type { DeskQuote, QuoteStatus } from '@/lib/types'
import { EmptyQuotes } from '@/components/quotes/EmptyQuotes'
import { QuoteEditModal, type QuoteEditValues } from '@/components/quotes/QuoteEditModal'
import { QuoteRow } from '@/components/quotes/QuoteRow'

type FilterKey = 'all' | QuoteStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'expired', label: 'Expired' },
]

function enrichQuote(
  q: DeskQuote,
  clientMap: Map<string, string>,
  packageMap: Map<string, string>,
): DeskQuote {
  return {
    ...q,
    clientName: q.clientName || clientMap.get(q.client_id) || 'Client',
    packageName: q.packageName || packageMap.get(q.package_id),
  }
}

export default function QuotesPage() {
  const { quotes, clients, packages, setQuotes, setJobs, setClients } = useData()
  const { setPage } = useDeskNav()
  const { toast, alert, promptForm } = useUi()
  const { ensureClientsAndPackages } = useCreateActions()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<DeskQuote | null | 'new'>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const packageMap = useMemo(() => new Map(packages.map((p) => [p.id, p.name])), [packages])

  const enriched = useMemo(
    () => quotes.map((q) => enrichQuote(q, clientMap, packageMap)),
    [quotes, clientMap, packageMap],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false
      if (!q) return true
      return [
        item.clientName,
        item.quote_number,
        item.packageName,
        item.status,
        item.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [enriched, filter, search])

  const draftCount = useMemo(
    () => quotes.filter((q) => q.status === 'draft').length,
    [quotes],
  )
  const openValue = useMemo(
    () =>
      quotes
        .filter((q) => q.status === 'draft' || q.status === 'sent')
        .reduce((s, q) => s + q.subtotal, 0),
    [quotes],
  )

  const patchLocal = (updated: DeskQuote) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
  }

  async function onSave(values: QuoteEditValues) {
    if (!values.client_id || !values.package_id) {
      alert('Pick a client and package', 'Missing fields')
      return
    }
    const extras = values.extra_line_items.filter((l) => l.description.trim())
    const subtotal =
      Math.round(
        ((Number(values.package_price) || 0) + sumLineAmounts(extras)) * 100,
      ) / 100

    setSaving(true)
    try {
      if (editing === 'new') {
        const created = await api.createQuote({
          client_id: values.client_id,
          package_id: values.package_id,
          vehicle_type: values.vehicle_type,
          location_type: values.location_type,
          date: values.date || todayISO(),
          subtotal,
          notes: values.notes,
          valid_until: values.valid_until || undefined,
          extra_line_items: extras,
        })
        const withNames = enrichQuote(created, clientMap, packageMap)
        setQuotes((prev) => [withNames, ...prev])
        setExpandedId(created.id)
        setEditing(null)
        toast('Quote created')
        return
      }

      if (!editing) return
      const current = editing
      const updated = await api.updateQuote(current.id, {
        status: values.status,
        subtotal,
        notes: values.notes,
        date: values.date,
        valid_until: values.valid_until || null,
        vehicle_type: values.vehicle_type,
        location_type: values.location_type,
        package_id: values.package_id,
        extra_line_items: extras,
        sent_at:
          values.status === 'sent' && !current.sent_at
            ? new Date().toISOString().slice(0, 10)
            : undefined,
      })
      patchLocal(enrichQuote({ ...current, ...updated }, clientMap, packageMap))
      setEditing(null)
      toast('Quote updated')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save quote', 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onMarkSent(q: DeskQuote) {
    setBusyId(q.id)
    try {
      const updated = await api.markQuoteSent(q.id)
      patchLocal(enrichQuote({ ...q, ...updated }, clientMap, packageMap))
      toast('Marked sent')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not mark sent', 'Send failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onAccept(q: DeskQuote) {
    setBusyId(q.id)
    try {
      const { quote, job } = await api.acceptQuote(q.id)
      patchLocal(enrichQuote({ ...q, ...quote }, clientMap, packageMap))
      setJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]))
      toast('Accepted — job scheduled')
      setPage('calendar')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not accept quote', 'Accept failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onDelete(q: DeskQuote) {
    if (!window.confirm(`Delete quote ${q.quote_number || q.id}?`)) return
    setBusyId(q.id)
    try {
      await api.deleteQuote(q.id)
      setQuotes((prev) => prev.filter((row) => row.id !== q.id))
      if (expandedId === q.id) setExpandedId(null)
      toast('Quote deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete', 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function ensureContactEmail(clientId: string, current?: string): Promise<string | null> {
    const existing = current?.trim()
    if (existing && isValidContactEmail(existing)) return existing

    const values = await promptForm({
      title: existing ? 'Fix contact email' : 'Add contact email',
      submitLabel: 'Save & continue',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          defaultValue: existing || '',
          placeholder: 'client@email.com',
        },
      ],
    })
    if (!values) return null
    const next = values.email?.trim() || ''
    if (!isValidContactEmail(next)) {
      alert('Enter a valid email address (name@domain.com).', 'Invalid email')
      return null
    }
    const updated = await api.updateClient(clientId, { email: next })
    setClients((prev) => prev.map((c) => (c.id === clientId ? updated : c)))
    return next
  }

  async function onOpenPdf(q: DeskQuote) {
    setBusyId(q.id)
    try {
      await downloadQuotePdf(q)
      toast('PDF downloaded')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not export PDF'), 'PDF failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onCopyPortal(q: DeskQuote) {
    setBusyId(q.id)
    try {
      const link = await createPortalLink({
        clientId: q.client_id,
        scope: 'quote',
        quoteId: q.id,
      })
      await copyTextToClipboard(link.url)
      toast('Portal link copied')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not create link'), 'Copy link failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onEmail(q: DeskQuote) {
    const client = clientById.get(q.client_id)
    let to: string
    try {
      const resolved = await ensureContactEmail(q.client_id, client?.email)
      if (!resolved) return
      to = resolved
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not save email'), 'Email failed')
      return
    }

    setBusyId(q.id)
    try {
      const link = await createPortalLink({
        clientId: q.client_id,
        scope: 'quote',
        quoteId: q.id,
      })
      const businessName = getCachedBusinessName() || 'Rinse'
      const clientName = clientById.get(q.client_id)?.name || client?.name || 'there'
      const subject = `Quote ${q.quote_number} from ${businessName}`
      const message = `Hi ${clientName},\n\nHere is your quote ${q.quote_number}.`
      const via = await sendDocumentLink({
        to,
        clientName,
        businessName,
        portalUrl: link.url,
        subject,
        message,
        clientId: q.client_id,
      })
      toast(via === 'api' ? 'Email sent' : 'Opened mail app')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not email link'), 'Email failed')
    } finally {
      setBusyId(null)
    }
  }

  const canCreate = clients.length > 0 && packages.length > 0

  if (quotes.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-ink-100">
        <Header title="Quotes" subtitle="0 shown" />
        <EmptyQuotes
          onCreate={() => {
            if (canCreate) {
              setEditing('new')
              return
            }
            void ensureClientsAndPackages('create a quote')
          }}
        />
        {editing === 'new' ? (
          <QuoteEditModal
            quote={null}
            clients={clients}
            packages={packages.filter((p) => p.active).length ? packages.filter((p) => p.active) : packages}
            saving={saving}
            onClose={() => setEditing(null)}
            onSave={(v) => void onSave(v)}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ink-100">
      <Header
        title="Quotes"
        subtitle={`${filtered.length} shown`}
        actions={
          <button
            type="button"
            onClick={() => {
              if (!canCreate) {
                void ensureClientsAndPackages('create a quote')
                return
              }
              setEditing('new')
            }}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New quote
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        <div className="max-w-[1180px] mx-auto px-6 py-6">
          <section className="rounded-2xl bg-white ring-1 ring-ink-200 shadow-card p-5 mb-5">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Open pipeline
                </div>
                <div className="text-[36px] font-semibold tracking-tight leading-none mt-2 tabular-nums text-ink-900">
                  {money(openValue)}
                </div>
                <div className="text-[12.5px] text-ink-500 mt-2">
                  {draftCount} draft · shared PocketBase with mobile
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client, number, package…"
                  className="w-full pl-9 pr-3 h-10 text-[13px] bg-ink-100 rounded-lg border border-transparent focus:border-brand-400 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                      filter === key
                        ? 'bg-ink-900 text-white'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {filtered.length === 0 ? (
            <EmptyQuotes variant="no-match" onClearFilters={() => { setSearch(''); setFilter('all') }} />
          ) : (
            <div className="space-y-2">
              {filtered.map((q) => (
                <QuoteRow
                  key={q.id}
                  quote={q}
                  clientName={q.clientName || 'Client'}
                  packageName={q.packageName}
                  expanded={expandedId === q.id}
                  busy={busyId === q.id}
                  onToggle={() => setExpandedId((id) => (id === q.id ? null : q.id))}
                  onEdit={() => setEditing(q)}
                  onMarkSent={() => void onMarkSent(q)}
                  onAccept={() => void onAccept(q)}
                  onDelete={() => void onDelete(q)}
                  onOpenPdf={() => void onOpenPdf(q)}
                  onCopyPortal={() => void onCopyPortal(q)}
                  onEmail={() => void onEmail(q)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <QuoteEditModal
          quote={editing === 'new' ? null : editing}
          clients={clients}
          packages={
            packages.filter((p) => p.active).length ? packages.filter((p) => p.active) : packages
          }
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={(v) => void onSave(v)}
        />
      ) : null}
    </div>
  )
}
