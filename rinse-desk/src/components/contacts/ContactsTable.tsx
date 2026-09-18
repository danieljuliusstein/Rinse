import { useState, type ReactNode } from 'react'
import {
  Car,
  ChevronDown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import AddressAutocompleteInput, {
  validateContactAddress,
} from '@/components/AddressAutocompleteInput'
import { IDENTIFIERS, type ContactIdentifier } from '@/lib/contact-identifier'
import type { GeocodeHit } from '@/lib/route-api'
import {
  AVATAR_TONE_CLASS,
  IDENTIFIER_META,
  type AvatarToneKey,
} from './identifierMeta'

export type ContactRowModel = {
  id: string
  name: string
  account: string
  leadSource: string
  vehicleCount: number
  identifier: ContactIdentifier
  title: string
  /** Table cell: last job date or notes snippet */
  notesDisplay: string
  /** Raw notes field for inline edit */
  notes: string
  phone: string
  email: string
  location: string
  initials: string
  avatarTone: AvatarToneKey
  pinned: boolean
  lat?: number | null
  lng?: number | null
}

export type ContactEditDraft = {
  name: string
  phone: string
  email: string
  address: string
  notes: string
  identifier: ContactIdentifier
  title: string
  geo?: GeocodeHit | null
}

type GroupBy = 'none' | 'identifier' | 'account'

type Props = {
  contacts: ContactRowModel[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
  groupBy: GroupBy
  businessAddress: string
  busy: boolean
  totalFiltered: number
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onSave: (id: string, draft: ContactEditDraft) => void | Promise<void>
  onDelete: (id: string, name: string) => void | Promise<void>
  onInspectContact?: (contact: ContactRowModel) => void
}

function Avatar({
  initials,
  tone,
  size = 'h-8 w-8',
}: {
  initials: string
  tone: AvatarToneKey
  size?: string
}) {
  return (
    <div
      className={`${size} rounded-full grid place-items-center text-[12px] font-semibold ring-1 ring-black/5 ${AVATAR_TONE_CLASS[tone]}`}
    >
      {initials}
    </div>
  )
}

function IdPill({ id }: { id: ContactIdentifier }) {
  const m = IDENTIFIER_META[id]
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-semibold ring-1 ${m.chip}`}
      style={{ background: m.bg, color: m.text }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function VehicleChip({ count }: { count: number }) {
  if (count === 0) return <span className="text-[12px] text-rinse-muted">—</span>
  return (
    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-rinse-bg ring-1 ring-rinse-border text-[11px] font-medium text-rinse-muted shrink-0">
      <Car className="h-3 w-3 text-rinse-muted" />
      {count}
    </span>
  )
}

function CellText({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={`text-[12.5px] truncate ${muted ? 'text-rinse-muted' : 'text-rinse-text'}`}>
      {children}
    </span>
  )
}

function EditField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10.5px] uppercase tracking-wide text-rinse-muted font-semibold">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  'h-8 px-2.5 rounded-md bg-white border border-rinse-border text-[12.5px] text-rinse-text focus:outline-none focus:ring-2 focus:ring-rinse-green/30 focus:border-rinse-green-border transition w-full min-w-0'

function EditRow({
  contact,
  businessAddress,
  busy,
  onCancel,
  onSave,
  onDelete,
}: {
  contact: ContactRowModel
  businessAddress: string
  busy: boolean
  onCancel: () => void
  onSave: (draft: ContactEditDraft) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<ContactEditDraft>(() => ({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    address: contact.location === '—' ? '' : contact.location,
    notes: contact.notes,
    identifier: contact.identifier,
    title: contact.title === '—' ? '' : contact.title,
    geo: contact.pinned
      ? {
          lat: contact.lat!,
          lng: contact.lng!,
          display_name: contact.location,
          quality: 'house',
        }
      : null,
  }))
  const [localError, setLocalError] = useState<string | null>(null)

  function submit() {
    if (!draft.name.trim()) {
      setLocalError('Name is required')
      return
    }
    const addressErr = validateContactAddress({
      address: draft.address.trim(),
      pinned: Boolean(draft.geo),
      requireStructuredManual: true,
    })
    if (addressErr) {
      setLocalError(addressErr)
      return
    }
    setLocalError(null)
    onSave(draft)
  }

  return (
    <div className="bg-white border-2 border-rinse-green/50 shadow-[0_0_0_4px_rgba(34,197,94,0.10)] animate-contacts-fade-in mx-1 my-1 rounded-lg overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[240px] shrink-0 p-3 border-b lg:border-b-0 lg:border-r border-rinse-border bg-rinse-bg/50 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Avatar initials={contact.initials} tone={contact.avatarTone} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] uppercase tracking-wide text-rinse-muted font-semibold">
                Name
              </div>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={inputCls}
                aria-label="Name"
              />
            </div>
          </div>
          <EditField label="Identifier">
            <select
              value={draft.identifier}
              onChange={(e) =>
                setDraft({ ...draft, identifier: e.target.value as ContactIdentifier })
              }
              className={inputCls}
              aria-label="Identifier"
            >
              {IDENTIFIERS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </EditField>
          <EditField label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputCls}
              aria-label="Title"
              placeholder="Title"
            />
          </EditField>
        </div>

        <div className="flex-1 p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-2.5 content-start min-w-0">
          <EditField label="Phone">
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-rinse-muted" />
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className={`${inputCls} pl-7`}
                placeholder="Add phone"
                aria-label="Phone"
              />
            </div>
          </EditField>
          <EditField label="Email">
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-rinse-muted" />
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={`${inputCls} pl-7`}
                placeholder="Add email"
                aria-label="Email"
              />
            </div>
          </EditField>
          <EditField label="Location">
            <div className="relative min-w-0">
              <AddressAutocompleteInput
                className={inputCls}
                value={draft.address}
                aria-label="Location"
                placeholder="Street address"
                context={businessAddress}
                compact
                requireStructuredManual
                initiallyPinned={Boolean(draft.geo)}
                onChange={(address) => setDraft({ ...draft, address, geo: null })}
                onPickSuggestion={(hit) =>
                  setDraft({ ...draft, address: hit.display_name, geo: hit })
                }
              />
            </div>
          </EditField>
          <div className="sm:col-span-2 xl:col-span-3">
            <EditField label="Notes">
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                className={`${inputCls} h-auto py-1.5 resize-none`}
                placeholder="Preferences, follow-ups…"
                aria-label="Notes"
              />
            </EditField>
          </div>

          {localError ? (
            <div className="sm:col-span-2 xl:col-span-3 text-[12px] text-red-600">{localError}</div>
          ) : null}

          <div className="sm:col-span-2 xl:col-span-3 flex items-center justify-between pt-1 gap-2 flex-wrap">
            <button
              type="button"
              disabled={busy}
              onClick={onDelete}
              className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md text-[12px] text-red-600 hover:bg-red-50 transition disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete contact
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-rinse-border text-[12.5px] text-rinse-muted hover:bg-rinse-bg transition disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="h-8 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-rinse-green-text text-white text-[12.5px] font-semibold hover:bg-rinse-green-hover transition shadow-sm disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  c,
  selected,
  onToggle,
  editing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  businessAddress,
  busy,
  onInspectContact,
}: {
  c: ContactRowModel
  selected: boolean
  onToggle: () => void
  editing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (draft: ContactEditDraft) => void
  onDelete: () => void
  businessAddress: string
  busy: boolean
  onInspectContact?: (contact: ContactRowModel) => void
}) {
  if (editing) {
    return (
      <EditRow
        contact={c}
        businessAddress={businessAddress}
        busy={busy}
        onCancel={onCancelEdit}
        onSave={onSaveEdit}
        onDelete={onDelete}
      />
    )
  }

  return (
    <div
      data-tour-target="contacts-row"
      onClick={() => {
        onToggle()
        onInspectContact?.(c)
      }}
      className={`group grid contacts-row-grid items-center min-h-[48px] border-b border-[#EDEFEA] last:border-b-0 hover:bg-rinse-bg/40 transition-colors cursor-pointer ${
        selected ? 'bg-rinse-green-soft/25' : ''
      }`}
    >
      <div className="flex items-center justify-center py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
            onInspectContact?.(c)
          }}
          className={[
            'h-4 w-4 rounded border grid place-items-center transition',
            selected
              ? 'bg-rinse-green-text border-rinse-green-text'
              : 'border-rinse-border bg-white group-hover:border-rinse-muted',
          ].join(' ')}
          aria-label={selected ? `Deselect ${c.name}` : `Select ${c.name}`}
        >
          {selected ? (
            <svg
              viewBox="0 0 12 12"
              className="h-2.5 w-2.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6.5l2.5 2.5 4.5-5" />
            </svg>
          ) : null}
        </button>
      </div>
      <div className="flex items-center justify-center py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
            onInspectContact?.(c)
          }}
          title="Edit contact"
          aria-label={`Edit ${c.name}`}
          className="h-6 w-6 rounded-md grid place-items-center text-rinse-muted opacity-0 group-hover:opacity-100 hover:bg-rinse-bg hover:text-rinse-text transition"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="pr-2 flex items-center gap-2 min-w-0 py-2">
        <Avatar initials={c.initials} tone={c.avatarTone} />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-rinse-text truncate leading-tight">
            {c.name}
          </div>
          <div className="text-[11px] text-rinse-muted truncate leading-tight">{c.leadSource}</div>
        </div>
      </div>
      <div className="pr-2 flex items-center gap-1.5 min-w-0 py-2">
        <span className="text-[12.5px] text-rinse-text truncate">{c.account}</span>
        <VehicleChip count={c.vehicleCount} />
      </div>
      <div className="pr-2 flex items-center min-w-0 py-2">
        <IdPill id={c.identifier} />
      </div>
      <div className="pr-2 flex items-center min-w-0 py-2 hidden xl:flex">
        <CellText>{c.title}</CellText>
      </div>
      <div className="pr-2 flex items-center min-w-0 py-2">
        <CellText muted={!c.notesDisplay || c.notesDisplay === '—'}>
          {c.notesDisplay || 'No notes'}
        </CellText>
      </div>
      <div className="pr-2 flex items-center min-w-0 py-2 hidden lg:flex">
        {c.phone ? (
          <CellText>{c.phone}</CellText>
        ) : (
          <span className="text-[11px] text-rinse-muted/70 italic">no phone</span>
        )}
      </div>
      <div className="pr-2 flex items-center min-w-0 py-2 hidden lg:flex">
        {c.email ? (
          <a href={`mailto:${c.email}`} className="text-[12.5px] text-rinse-green-text truncate hover:underline">
            {c.email}
          </a>
        ) : (
          <span className="text-[11px] text-rinse-muted/70 italic">no email</span>
        )}
      </div>
      <div className="pr-3 flex items-center gap-1.5 min-w-0 py-2">
        <MapPin className="h-3 w-3 text-rinse-muted shrink-0" />
        <span className="text-[12.5px] text-rinse-muted truncate">{c.location}</span>
      </div>
    </div>
  )
}

function GroupHeader({ label, count, accent }: { label: string; count: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 h-8 px-3 bg-rinse-bg/70 border-b border-[#EDEFEA] sticky top-9 z-10">
      <span className={`h-2 w-2 rounded-full ${accent}`} />
      <span className="text-[11.5px] font-semibold uppercase tracking-wide text-rinse-text">
        {label}
      </span>
      <span className="text-[11px] text-rinse-muted">·</span>
      <span className="text-[11px] text-rinse-muted">{count}</span>
      <ChevronDown className="h-3 w-3 text-rinse-muted ml-0.5" />
    </div>
  )
}

export function ContactsTable({
  contacts,
  selected,
  setSelected,
  editingId,
  setEditingId,
  groupBy,
  businessAddress,
  busy,
  totalFiltered,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onSave,
  onDelete,
  onInspectContact,
}: Props) {
  const toggle = (id: string) => {
    const n = new Set(selected)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setSelected(n)
  }

  const allSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id))
  const someSelected = contacts.some((c) => selected.has(c.id)) && !allSelected

  const from = totalFiltered === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalFiltered)

  const renderRow = (c: ContactRowModel) => (
    <Row
      key={c.id}
      c={c}
      selected={selected.has(c.id)}
      onToggle={() => toggle(c.id)}
      editing={editingId === c.id}
      onEdit={() => setEditingId(c.id)}
      onCancelEdit={() => setEditingId(null)}
      onSaveEdit={(draft) => void onSave(c.id, draft)}
      onDelete={() => void onDelete(c.id, c.name)}
      businessAddress={businessAddress}
      busy={busy}
      onInspectContact={onInspectContact}
    />
  )

  let body: ReactNode
  if (groupBy === 'identifier') {
    const groups = new Map<ContactIdentifier, ContactRowModel[]>()
    for (const c of contacts) {
      const list = groups.get(c.identifier) ?? []
      list.push(c)
      groups.set(c.identifier, list)
    }
    const order: ContactIdentifier[] = ['Account', 'Client', 'Prospect', 'Type']
    body = order
      .filter((k) => groups.has(k))
      .map((k) => (
        <div key={k}>
          <GroupHeader
            label={k}
            count={groups.get(k)!.length}
            accent={IDENTIFIER_META[k].dot}
          />
          {groups.get(k)!.map(renderRow)}
        </div>
      ))
  } else if (groupBy === 'account') {
    const groups = new Map<string, ContactRowModel[]>()
    for (const c of contacts) {
      const key = c.account === '—' ? 'No account' : c.account
      const list = groups.get(key) ?? []
      list.push(c)
      groups.set(key, list)
    }
    body = [...groups.entries()].map(([k, list]) => (
      <div key={k}>
        <GroupHeader label={k} count={list.length} accent="bg-rinse-muted" />
        {list.map(renderRow)}
      </div>
    ))
  } else {
    body = contacts.map(renderRow)
  }

  const pageButtons = (() => {
    if (pageCount <= 1) return [0]
    const pages = new Set<number>([0, pageCount - 1, page, page - 1, page + 1])
    return [...pages].filter((p) => p >= 0 && p < pageCount).sort((a, b) => a - b)
  })()

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0">
      <div className="flex-1 min-h-0 overflow-auto bg-white thin-scrollbar">
        <div className="min-w-0 w-full">
          <div className="sticky top-0 z-20 grid contacts-row-grid items-center h-9 bg-white border-b border-rinse-border">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  if (allSelected) setSelected(new Set())
                  else setSelected(new Set(contacts.map((c) => c.id)))
                }}
                className={[
                  'h-4 w-4 rounded border grid place-items-center transition',
                  allSelected
                    ? 'bg-rinse-green-text border-rinse-green-text'
                    : someSelected
                      ? 'bg-rinse-green-text/80 border-rinse-green-text'
                      : 'border-rinse-border bg-white',
                ].join(' ')}
                aria-label={allSelected ? 'Deselect all' : 'Select all on page'}
              >
                {allSelected ? (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                  </svg>
                ) : null}
                {someSelected && !allSelected ? (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2 w-2 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M3 6h6" />
                  </svg>
                ) : null}
              </button>
            </div>
            <div />
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
              Contact
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
              Account
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
              ID
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold hidden xl:block">
              Title
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
              Notes / last job
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold hidden lg:block">
              Phone
            </div>
            <div className="pr-2 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold hidden lg:block">
              Email
            </div>
            <div className="pr-3 text-[10.5px] uppercase tracking-wider text-rinse-muted font-semibold">
              Location
            </div>
          </div>
          <div>{body}</div>
        </div>
      </div>

      <div className="h-11 shrink-0 flex items-center justify-between px-4 bg-white border-t border-rinse-border text-[12px] text-rinse-muted gap-3">
        <div className="min-w-0 truncate">
          Showing{' '}
          <span className="font-medium text-rinse-text">
            {from}–{to}
          </span>{' '}
          of {totalFiltered}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="h-7 px-2 rounded-md border border-rinse-border text-rinse-muted hover:bg-rinse-bg disabled:opacity-40"
          >
            Prev
          </button>
          {pageButtons.map((p, i) => {
            const prev = pageButtons[i - 1]
            const gap = prev != null && p - prev > 1
            return (
              <span key={p} className="inline-flex items-center gap-1">
                {gap ? <span className="px-0.5 text-rinse-muted">…</span> : null}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={[
                    'px-2.5 h-7 inline-flex items-center rounded-md font-medium',
                    p === page
                      ? 'bg-rinse-sidebar-from text-white'
                      : 'border border-rinse-border text-rinse-muted hover:bg-rinse-bg',
                  ].join(' ')}
                >
                  {p + 1}
                </button>
              </span>
            )
          })}
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
            className="h-7 px-2 rounded-md border border-rinse-border text-rinse-muted hover:bg-rinse-bg disabled:opacity-40"
          >
            Next
          </button>
          <span className="ml-2 text-rinse-muted hidden sm:inline">· {pageSize} / page</span>
        </div>
      </div>
    </div>
  )
}
