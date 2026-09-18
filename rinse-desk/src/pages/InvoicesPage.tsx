import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search, X } from 'lucide-react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import * as api from '@/lib/api'
import { getJobPhotos } from '@/lib/job-photos-api'
import { jobHasBeforeAndAfter, transformationPdfMissingMessage } from '@/lib/job-photos'
import { money, todayISO } from '@/lib/metrics'
import {
  AGING_FILTER_BUCKETS,
  AGING_LABELS,
  summarizeAging,
  type AgingBucket,
} from '@/lib/invoice-aging'
import {
  filterInvoices,
  filterInvoicesByAging,
  INVOICE_FILTERS,
  openBalanceTotal,
  searchInvoices,
  type InvoiceFilterKey,
} from '@/lib/invoices-list'
import {
  buildInvoiceUpdatePatch,
  type InvoiceEditValues,
} from '@/lib/invoice-edit'
import {
  copyTextToClipboard,
  createPortalLink,
  downloadInvoicePdf,
  isValidContactEmail,
  sendDocumentLink,
  shareErrorMessage,
} from '@/lib/document-share'
import { getCachedBusinessName } from '@/lib/business-brand'
import type { DeskInvoice } from '@/lib/types'
import { EmptyInvoices } from '@/components/invoices/EmptyInvoices'
import { InvoiceEditModal } from '@/components/invoices/InvoiceEditModal'
import { InvoiceRow } from '@/components/invoices/InvoiceRow'
import { useOptionalTour } from '@/components/tour/tour-provider'
import { useCreateActions } from '@/hooks/useCreateActions'

function monthKey(inv: DeskInvoice): string {
  if (inv.status === 'draft' && !inv.sent_at) return 'Drafts'
  const iso = inv.sent_at ?? inv.paid_at ?? inv.created
  if (!iso) return 'Drafts'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Drafts'
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function groupByMonth(list: DeskInvoice[]) {
  const map = new Map<string, DeskInvoice[]>()
  for (const inv of list) {
    const k = monthKey(inv)
    const bucket = map.get(k) ?? []
    bucket.push(inv)
    map.set(k, bucket)
  }
  const order = (k: string) => (k === 'Drafts' ? -1 : new Date(k).getTime())
  return [...map.entries()]
    .sort((a, b) => order(b[0]) - order(a[0]))
    .map(([month, items]) => ({
      month,
      items: [...items].sort((a, b) => {
        const da = a.sent_at ?? a.paid_at ?? a.created ?? ''
        const db = b.sent_at ?? b.paid_at ?? b.created ?? ''
        return db.localeCompare(da)
      }),
    }))
}

export default function InvoicesPage() {
  const { invoices, clients, jobs, setInvoices, setJobs, setClients } = useData()
  const { focusInvoiceId, clearFocusInvoice, setPage } = useDeskNav()
  const { toast, alert, promptForm } = useUi()
  const tour = useOptionalTour()
  const { createEvent } = useCreateActions()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InvoiceFilterKey>('open')
  const [agingFilter, setAgingFilter] = useState<AgingBucket | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<DeskInvoice | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const jobService = useMemo(() => {
    const map = new Map(jobs.map((j) => [j.id, j.packageName || j.vehicle_type || '']))
    return (jobId: string) => map.get(jobId) || undefined
  }, [jobs])

  const openBal = useMemo(() => openBalanceTotal(invoices), [invoices])
  const overdueTotal = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'overdue')
        .reduce((s, i) => s + i.balance_due, 0),
    [invoices],
  )
  const overdueCount = useMemo(
    () => invoices.filter((i) => i.status === 'overdue').length,
    [invoices],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<InvoiceFilterKey, number> = {
      all: invoices.length,
      open: 0,
      overdue: 0,
      paid: 0,
      draft: 0,
    }
    for (const inv of invoices) {
      if (inv.status === 'paid') counts.paid += 1
      else if (inv.status === 'draft') counts.draft += 1
      else if (inv.status === 'overdue') {
        counts.overdue += 1
        counts.open += 1
      } else if (inv.status !== 'void' && inv.status !== 'cancelled') {
        counts.open += 1
      }
    }
    return counts
  }, [invoices])

  const showAging = filter === 'open' || filter === 'overdue'

  const agingChipCounts = useMemo(() => {
    const scope = filterInvoices(invoices, filter === 'overdue' ? 'overdue' : 'open')
    const summary = summarizeAging(scope)
    return {
      all: scope.length,
      '1-30': summary['1-30'].count,
      '31-60': summary['31-60'].count,
      '60+': summary['60+'].count,
    }
  }, [invoices, filter])

  const filtered = useMemo(() => {
    let list = filterInvoices(invoices, filter)
    list = searchInvoices(list, search, clientMap)
    list = filterInvoicesByAging(list, agingFilter)
    return list
  }, [invoices, filter, search, clientMap, agingFilter])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  useEffect(() => {
    if (filter !== 'open' && filter !== 'overdue') setAgingFilter(null)
  }, [filter])

  useEffect(() => {
    if (!focusInvoiceId) return
    setExpandedId(focusInvoiceId)
    setFilter('all')
    setAgingFilter(null)
    clearFocusInvoice()
  }, [focusInvoiceId, clearFocusInvoice])

  // Tour: ensure a draft exists (create from latest job), then expand for Mark sent.
  useEffect(() => {
    if (!tour?.active || tour.stop.id !== 'invoices') return
    const draft = invoices.find((i) => i.status === 'draft')
    if (draft) {
      setFilter('all')
      setAgingFilter(null)
      setExpandedId(draft.id)
      return
    }
    const invoiced = new Set(invoices.map((i) => i.job_id).filter(Boolean))
    const candidate =
      jobs.find((j) => j.status !== 'cancelled' && !invoiced.has(j.id)) ??
      jobs.find((j) => j.status !== 'cancelled')
    if (!candidate) return
    let cancelled = false
    void (async () => {
      try {
        const inv = await api.ensureDraftInvoiceForJob(candidate.id, invoices)
        if (cancelled) return
        setInvoices((prev) => (prev.some((i) => i.id === inv.id) ? prev : [inv, ...prev]))
        setJobs((prev) =>
          prev.map((j) =>
            j.id === candidate.id ? { ...j, invoice_id: inv.id, status: 'invoiced' as const } : j,
          ),
        )
        setFilter('all')
        setAgingFilter(null)
        setExpandedId(inv.id)
      } catch {
        /* user can tap Create invoice */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tour?.active, tour?.stop.id, invoices, jobs, setInvoices, setJobs])

  const jobsWithoutInvoice = useMemo(() => {
    const invoiced = new Set(invoices.map((i) => i.job_id).filter(Boolean))
    return jobs.filter((j) => j.status !== 'cancelled' && !invoiced.has(j.id))
  }, [jobs, invoices])

  const canCreateInvoice = jobsWithoutInvoice.length > 0

  async function createDraftForJobId(jobId: string, jobHint?: { client_id?: string; revenue?: number }) {
    setCreating(true)
    if (tour?.active || jobId.startsWith('tour-') || jobId.startsWith('dummy-') || jobId.startsWith('temp-')) {
      const candidateJob = jobHint ?? jobs.find((j) => j.id === jobId)
      const inv: DeskInvoice = {
        id: `tour-inv-${Date.now()}`,
        invoice_number: `INV-${1000 + invoices.length + 1}`,
        job_id: jobId,
        client_id: candidateJob?.client_id || 'tour-client-marcus',
        subtotal: candidateJob?.revenue || 250,
        tip: 0,
        status: 'draft',
        total: candidateJob?.revenue || 250,
        amount_paid: 0,
        balance_due: candidateJob?.revenue || 250,
        created: todayISO(),
      }
      setInvoices((prev) => (prev.some((i) => i.id === inv.id) ? prev : [inv, ...prev]))
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, invoice_id: inv.id, status: 'invoiced' as const } : j,
        ),
      )
      setFilter('all')
      setAgingFilter(null)
      setExpandedId(inv.id)
      setCreating(false)
      toast('Draft invoice created')
      return
    }
    try {
      const inv = await api.createInvoiceForJob(jobId)
      setInvoices((prev) => (prev.some((i) => i.id === inv.id) ? prev : [inv, ...prev]))
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, invoice_id: inv.id, status: 'invoiced' as const } : j,
        ),
      )
      setFilter('all')
      setAgingFilter(null)
      setExpandedId(inv.id)
      toast('Draft invoice created')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create invoice', 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function onCreateInvoice() {
    if (creating) return
    const candidates = jobsWithoutInvoice
    if (candidates.length === 0) {
      await onScheduleJobForInvoice()
      return
    }
    let jobId = candidates[0]!.id
    if (candidates.length > 1) {
      const values = await promptForm({
        title: 'Create invoice',
        submitLabel: 'Create draft',
        fields: [
          {
            name: 'job_id',
            label: 'Job',
            type: 'select',
            required: true,
            defaultValue: candidates[0]!.id,
            options: candidates.map((j) => ({
              value: j.id,
              label: `${j.date} · ${clientMap.get(j.client_id) ?? 'Client'} · ${money(j.revenue)}`,
            })),
          },
        ],
      })
      if (!values?.job_id) return
      jobId = values.job_id
    }
    await createDraftForJobId(jobId)
  }

  async function onScheduleJobForInvoice() {
    if (creating) return
    const job = await createEvent({
      navigate: false,
      formTitle: 'Schedule job to invoice',
      submitLabel: 'Create job & invoice',
    })
    if (!job) return
    await createDraftForJobId(job.id, job)
  }

  const patchLocal = useCallback(
    (updated: DeskInvoice) => {
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    },
    [setInvoices],
  )

  async function onMarkSent(inv: DeskInvoice) {
    setBusyId(inv.id)
    try {
      if (inv.id.startsWith('tour-') || inv.id.startsWith('dummy-') || tour?.active) {
        const updated: DeskInvoice = {
          ...inv,
          status: 'sent',
          sent_at: todayISO(),
        }
        patchLocal(updated)
        toast('Marked sent')
        tour?.notifyCreated('invoice')
        return
      }

      if (inv.job_id && !tour?.skipInvoicePhotoGate) {
        const photos = await getJobPhotos(inv.job_id)
        if (!jobHasBeforeAndAfter(photos)) {
          alert(
            `${transformationPdfMissingMessage()} Open Cars to add before & after photos for this job’s client.`,
            'Before & after required',
          )
          setPage('cars')
          return
        }
      }
      const updated = await api.markInvoiceSent(inv.id)
      patchLocal(updated)
      toast('Marked sent')
      tour?.notifyCreated('invoice')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not mark sent', 'Mark sent failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onMarkPaid(inv: DeskInvoice) {
    setBusyId(inv.id)
    try {
      if (inv.id.startsWith('tour-') || inv.id.startsWith('dummy-') || tour?.active) {
        const updated: DeskInvoice = {
          ...inv,
          status: 'paid',
          paid_at: todayISO(),
          amount_paid: inv.total,
          balance_due: 0,
        }
        patchLocal(updated)
        toast('Marked paid')
        return
      }

      const updated = await api.markInvoicePaid(inv.id, 'cash')
      patchLocal(updated)
      toast('Marked paid')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not mark paid', 'Mark paid failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onSaveEdit(values: InvoiceEditValues) {
    if (!editing || busyId) return
    setBusyId(editing.id)
    try {
      if (editing.id.startsWith('tour-') || editing.id.startsWith('dummy-') || tour?.active) {
        const patch = buildInvoiceUpdatePatch(editing, values)
        const updated: DeskInvoice = {
          ...editing,
          ...patch,
          paid_at: patch.paid_at || undefined,
          discount_amount: patch.discount_amount,
          tax_rate: patch.tax_rate,
          tax_amount: patch.tax_amount,
          po_number: patch.po_number,
          extra_line_items: patch.extra_line_items,
        }
        patchLocal(updated)
        setEditing(null)
        toast('Invoice updated')
        return
      }

      const patch = buildInvoiceUpdatePatch(editing, values)
      const updated = await api.updateInvoice(editing.id, patch)
      patchLocal(updated)
      setEditing(null)
      toast('Invoice updated')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update invoice', 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  function isSynthetic(id: string) {
    return id.startsWith('tour-') || id.startsWith('dummy-') || Boolean(tour?.active)
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

  async function onOpenPdf(inv: DeskInvoice) {
    if (isSynthetic(inv.id)) {
      alert('PDF export runs against live invoices outside the tour.', 'Tour mode')
      return
    }
    setBusyId(inv.id)
    try {
      let portalUrl: string | undefined
      try {
        const link = await createPortalLink({
          clientId: inv.client_id,
          scope: 'invoice',
          jobId: inv.job_id,
        })
        portalUrl = link.url
      } catch {
        /* portal URL is optional on the PDF */
      }
      await downloadInvoicePdf(inv, portalUrl)
      toast('PDF downloaded')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not export PDF'), 'PDF failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onCopyPortal(inv: DeskInvoice) {
    if (isSynthetic(inv.id)) {
      alert('Portal links need a live invoice outside the tour.', 'Tour mode')
      return
    }
    setBusyId(inv.id)
    try {
      const link = await createPortalLink({
        clientId: inv.client_id,
        scope: 'invoice',
        jobId: inv.job_id,
      })
      await copyTextToClipboard(link.url)
      toast('Portal link copied')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not create link'), 'Copy link failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onEmail(inv: DeskInvoice) {
    if (isSynthetic(inv.id)) {
      alert('Email send needs a live invoice outside the tour.', 'Tour mode')
      return
    }
    const client = clientById.get(inv.client_id)
    let to: string
    try {
      const resolved = await ensureContactEmail(inv.client_id, client?.email)
      if (!resolved) return
      to = resolved
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not save email'), 'Email failed')
      return
    }

    setBusyId(inv.id)
    try {
      const link = await createPortalLink({
        clientId: inv.client_id,
        scope: 'invoice',
        jobId: inv.job_id,
      })
      const businessName = getCachedBusinessName() || 'Rinse'
      const clientName = clientById.get(inv.client_id)?.name || client?.name || 'there'
      const subject = `Invoice ${inv.invoice_number} from ${businessName}`
      const message = `Hi ${clientName},\n\nHere is your invoice ${inv.invoice_number}.`
      const via = await sendDocumentLink({
        to,
        clientName,
        businessName,
        portalUrl: link.url,
        subject,
        message,
        clientId: inv.client_id,
      })
      toast(via === 'api' ? 'Email sent' : 'Opened mail app')
    } catch (err) {
      alert(shareErrorMessage(err, 'Could not email link'), 'Email failed')
    } finally {
      setBusyId(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setFilter('all')
    setAgingFilter(null)
  }

  const asOf = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (invoices.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col overflow-hidden bg-ink-100 ${
          tour?.isArmed('invoices-panel') || tour?.isArmed('invoices-create')
            ? 'tour-armed relative z-[55] pointer-events-auto'
            : ''
        }`}
        data-tour-target="invoices-panel"
      >
        <Header
          title="Invoices"
          subtitle="0 shown"
          actions={
            canCreateInvoice ? (
              <button
                type="button"
                data-tour-target="invoices-create"
                disabled={creating}
                onClick={() => void onCreateInvoice()}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600 transition shadow-sm disabled:opacity-60 relative z-[55] pointer-events-auto"
              >
                {creating ? 'Creating…' : 'Create invoice'}
              </button>
            ) : (
              <button
                type="button"
                data-tour-target="invoices-create"
                disabled={creating}
                onClick={() => void onScheduleJobForInvoice()}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600 transition shadow-sm relative z-[55] pointer-events-auto disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create invoice'}
              </button>
            )
          }
        />
        <EmptyInvoices
          createInvoiceAvailable={canCreateInvoice}
          creating={creating}
          onCreateInvoice={() => void onCreateInvoice()}
          onScheduleJob={() => void onScheduleJobForInvoice()}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden bg-ink-100 ${
        tour?.isArmed('invoices-send') || tour?.isArmed('invoices-panel')
          ? 'tour-armed relative z-[55] pointer-events-auto'
          : ''
      }`}
      data-tour-target="invoices-panel"
      onClick={() => {
        if (tour?.active && tour.stop.id === 'invoices') {
          tour.notifyCreated('invoice')
        }
      }}
    >
      <Header
        title="Invoices"
        subtitle={`${filtered.length} shown`}
        actions={
          canCreateInvoice ? (
            <button
              type="button"
              data-tour-target="invoices-create"
              disabled={creating}
              onClick={() => void onCreateInvoice()}
              className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600 transition shadow-sm disabled:opacity-60 ${
                tour?.isArmed('invoices-create')
                  ? 'tour-armed relative z-[55] pointer-events-auto'
                  : ''
              }`}
            >
              {creating ? 'Creating…' : 'Create invoice'}
            </button>
          ) : (
            <button
              type="button"
              disabled={creating}
              onClick={() => void onScheduleJobForInvoice()}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600 transition shadow-sm disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create invoice'}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        <div className="max-w-[1180px] mx-auto px-6 py-6">
          <section className="rounded-2xl bg-white ring-1 ring-ink-200 shadow-card p-5 mb-5 animate-invoices-fade-up">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Open balance
                </div>
                <div className="text-[36px] font-semibold tracking-tight leading-none mt-2 tabular-nums text-ink-900">
                  {money(openBal)}
                </div>
                <div className="text-[12.5px] text-ink-500 mt-2">
                  Across sent, overdue &amp; partial invoices
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Overdue
                  </div>
                  <div
                    className={`text-[20px] font-semibold mt-1 tabular-nums ${
                      overdueTotal > 0 ? 'text-rose-600' : 'text-ink-900'
                    }`}
                  >
                    {money(overdueTotal)}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      overdueCount > 0 ? 'text-rose-600/80' : 'text-ink-400'
                    }`}
                  >
                    {overdueCount} invoice{overdueCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="w-px h-12 bg-ink-200" />
                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    As of
                  </div>
                  <div className="text-[14px] font-medium mt-1 text-ink-700">{asOf}</div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice # or client…"
                className="w-full h-10 pl-9 pr-9 rounded-lg bg-white ring-1 ring-ink-200 text-[13px] text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500/40 focus:outline-none transition-shadow"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-ink-100 flex items-center justify-center text-ink-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white ring-1 ring-ink-200 flex-wrap">
              {INVOICE_FILTERS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilter(tab.key)
                    setAgingFilter(null)
                  }}
                  className={`px-3 h-9 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors ${
                    filter === tab.key
                      ? 'bg-ink-900 text-white'
                      : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] tabular-nums ${
                      filter === tab.key ? 'text-white/60' : 'text-ink-400'
                    }`}
                  >
                    {statusCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {showAging ? (
            <div className="flex items-center gap-2 mb-4 flex-wrap animate-invoices-fade-in">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mr-1">
                Aging
              </span>
              <button
                type="button"
                onClick={() => setAgingFilter(null)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold ring-1 transition-colors ${
                  agingFilter === null
                    ? 'bg-brand-500 text-brand-900 ring-brand-500'
                    : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
                }`}
              >
                All ages
                <span
                  className={`text-[10px] tabular-nums ${
                    agingFilter === null ? 'text-brand-900/60' : 'text-ink-400'
                  }`}
                >
                  {agingChipCounts.all}
                </span>
              </button>
              {AGING_FILTER_BUCKETS.map((bucket) => {
                const count =
                  bucket === '1-30'
                    ? agingChipCounts['1-30']
                    : bucket === '31-60'
                      ? agingChipCounts['31-60']
                      : agingChipCounts['60+']
                if (count === 0) return null
                const on = agingFilter === bucket
                return (
                  <button
                    key={bucket}
                    type="button"
                    onClick={() => setAgingFilter(on ? null : bucket)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold ring-1 transition-colors ${
                      on
                        ? 'bg-brand-500 text-brand-900 ring-brand-500'
                        : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    {AGING_LABELS[bucket]}
                    <span
                      className={`text-[10px] tabular-nums ${
                        on ? 'text-brand-900/60' : 'text-ink-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
              <div className="ml-1 text-[11px] text-ink-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Days since sent
              </div>
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <div className="rounded-2xl bg-white ring-1 ring-ink-200/80 overflow-hidden animate-invoices-fade-up">
              {groups.map(({ month, items }, gi) => {
                const total = items.reduce((s, i) => s + i.total, 0)
                const monthDue = items.reduce((s, i) => s + i.balance_due, 0)
                return (
                  <div key={month} className={gi > 0 ? 'border-t border-ink-100' : ''}>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 border-b border-ink-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-ink-900 uppercase tracking-wide">
                          {month}
                        </span>
                        <span className="text-[11px] text-ink-400 font-medium">
                          {items.length} invoice{items.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11.5px]">
                        <span className="text-ink-400">
                          Total{' '}
                          <span className="text-ink-700 font-semibold tabular-nums">
                            {money(total)}
                          </span>
                        </span>
                        {monthDue > 0 ? (
                          <span className="text-rose-500 font-semibold">
                            Due <span className="tabular-nums">{money(monthDue)}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="divide-y divide-ink-100">
                      {items.map((inv) => (
                        <InvoiceRow
                          key={inv.id}
                          inv={inv}
                          clientName={clientMap.get(inv.client_id) ?? 'Client'}
                          service={jobService(inv.job_id)}
                          expanded={expandedId === inv.id}
                          busy={busyId === inv.id}
                          onToggle={() =>
                            setExpandedId(expandedId === inv.id ? null : inv.id)
                          }
                          onEdit={() => setEditing(inv)}
                          onMarkSent={() => void onMarkSent(inv)}
                          onMarkPaid={() => void onMarkPaid(inv)}
                          onOpenPdf={() => void onOpenPdf(inv)}
                          onCopyPortal={() => void onCopyPortal(inv)}
                          onEmail={() => void onEmail(inv)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyInvoices variant="no-match" onClearFilters={clearFilters} />
          )}

          <p className="text-[11px] text-ink-400 mt-4 text-center">
            Invoices tab owns the list + light status actions. Charts, expenses, receipts &amp; the
            mobile invoice builder live in sibling tabs.
          </p>
        </div>
      </div>

      {editing ? (
        <InvoiceEditModal
          inv={editing}
          clientName={clientMap.get(editing.client_id) ?? 'Client'}
          saving={busyId === editing.id}
          onClose={() => setEditing(null)}
          onSave={(values) => void onSaveEdit(values)}
        />
      ) : null}
    </div>
  )
}
