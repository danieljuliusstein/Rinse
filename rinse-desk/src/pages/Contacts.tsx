import { useEffect, useMemo, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import * as api from '@/lib/api'
import { initials } from '@/lib/metrics'
import {
  ID_TAG_PREFIX,
  readIdentifier,
  tagsWithIdentifier,
} from '@/lib/contact-identifier'
import { geocodeAddressOnce } from '@/lib/geocode-once'
import { loadAppSettings } from '@/lib/settings-api'
import {
  ContactsToolbar,
  type ContactsToolbarState,
  type FilterFlag,
} from '@/components/contacts/ContactsToolbar'
import {
  ContactsTable,
  type ContactEditDraft,
  type ContactRowModel,
} from '@/components/contacts/ContactsTable'
import { EmptyNoContacts, EmptyNoMatches } from '@/components/contacts/EmptyContacts'
import { AVATAR_TONE_KEYS } from '@/components/contacts/identifierMeta'

const PAGE_SIZE = 25

export default function Contacts() {
  const { clients, setClients, vehicles, jobs } = useData()
  const { focusContactId, clearFocusContact } = useDeskNav()
  const { alert, toast } = useUi()
  const { createContact } = useCreateActions()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [businessAddress, setBusinessAddress] = useState('')

  const [toolbar, setToolbar] = useState<ContactsToolbarState>({
    query: '',
    activeIdentifier: 'All',
    groupBy: 'none',
    filters: [],
    selectedCount: 0,
  })

  useEffect(() => {
    void loadAppSettings()
      .then((s) => setBusinessAddress(s.business_address ?? ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setToolbar((t) => ({ ...t, selectedCount: selected.size }))
  }, [selected])

  const contacts = useMemo((): ContactRowModel[] => {
    return clients.map((c, i) => {
      const identifier = readIdentifier(c)
      const parent = c.parent_client_id
        ? clients.find((p) => p.id === c.parent_client_id)
        : null
      const vCount = vehicles.filter((v) => v.client_id === c.id).length
      const last = jobs
        .filter((j) => j.client_id === c.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const titleTag = c.tags?.find((t) => !t.startsWith(ID_TAG_PREFIX))
      const pinned =
        c.lat != null &&
        c.lng != null &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lng) &&
        !(c.lat === 0 && c.lng === 0)

      let account = '—'
      if (parent?.name) account = parent.name
      else if (c.lead_source) account = c.lead_source
      else if (vCount) account = `${vCount} vehicle${vCount === 1 ? '' : 's'}`

      return {
        id: c.id,
        name: c.name,
        account,
        leadSource: c.lead_source || (parent ? 'Account member' : '—'),
        vehicleCount: vCount,
        identifier,
        title: titleTag || '—',
        notesDisplay: last
          ? `Last job ${last.date}`
          : c.notes?.slice(0, 48) || '—',
        notes: c.notes || '',
        phone: c.phone || '',
        email: c.email || '',
        location: c.address || '—',
        initials: initials(c.name),
        avatarTone: AVATAR_TONE_KEYS[i % AVATAR_TONE_KEYS.length]!,
        pinned,
        lat: c.lat,
        lng: c.lng,
      }
    })
  }, [clients, vehicles, jobs])

  const filtered = useMemo(() => {
    let list = contacts
    if (toolbar.activeIdentifier !== 'All') {
      list = list.filter((c) => c.identifier === toolbar.activeIdentifier)
    }
    if (toolbar.filters.includes('Has phone')) {
      list = list.filter((c) => c.phone.trim() !== '')
    }
    if (toolbar.filters.includes('Has email')) {
      list = list.filter((c) => c.email.trim() !== '')
    }
    const q = toolbar.query.trim().toLowerCase()
    if (q) {
      list = list.filter((c) =>
        [c.name, c.account, c.email, c.location, c.identifier, c.leadSource, c.phone, c.title]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    return list
  }, [contacts, toolbar])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [toolbar.query, toolbar.activeIdentifier, toolbar.filters, toolbar.groupBy])

  useEffect(() => {
    if (editingId && !clients.some((c) => c.id === editingId)) {
      setEditingId(null)
    }
  }, [editingId, clients])

  useEffect(() => {
    if (!focusContactId) return
    setSelected(new Set([focusContactId]))
    const idx = filtered.findIndex((c) => c.id === focusContactId)
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE))
    setEditingId(focusContactId)
    clearFocusContact()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusContactId])

  async function saveEdit(id: string, draft: ContactEditDraft) {
    const existing = clients.find((c) => c.id === id)
    if (!existing) return
    setBusy(true)
    try {
      const baseTags = tagsWithIdentifier(existing.tags, draft.identifier)
      const tags = draft.title.trim()
        ? [...baseTags.filter((t) => t.startsWith(ID_TAG_PREFIX)), draft.title.trim()]
        : baseTags.filter((t) => t.startsWith(ID_TAG_PREFIX))

      const address = draft.address.trim()
      const addressChanged = (existing.address || '').trim() !== address
      const patch: {
        name: string
        phone?: string
        email?: string
        address?: string
        notes?: string
        tags: string[]
        lat?: number | null
        lng?: number | null
        geocoded_at?: string | null
      } = {
        name: draft.name.trim(),
        phone: draft.phone.trim() || undefined,
        email: draft.email.trim() || undefined,
        address: address || undefined,
        notes: draft.notes.trim(),
        tags,
      }

      let pinned = Boolean(draft.geo && address)
      if (draft.geo && address) {
        patch.lat = draft.geo.lat
        patch.lng = draft.geo.lng
        patch.geocoded_at = new Date().toISOString()
      } else if (address && (addressChanged || !existing.lat || !existing.lng)) {
        // Structured fields: geocode once on save (not while typing).
        const hit = await geocodeAddressOnce(address, { context: businessAddress })
        if (hit) {
          patch.lat = hit.lat
          patch.lng = hit.lng
          patch.geocoded_at = new Date().toISOString()
          pinned = true
        } else if (addressChanged) {
          patch.lat = null
          patch.lng = null
          patch.geocoded_at = null
        }
      } else if (!address && addressChanged) {
        patch.lat = null
        patch.lng = null
        patch.geocoded_at = null
      }

      const updated = await api.updateClient(id, patch)
      setClients((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      toast(pinned ? 'Contact updated · address pinned' : 'Contact updated')
      setEditingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update contact', 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  async function deleteContact(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api.deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (editingId === id) setEditingId(null)
      toast('Contact deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete contact', 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function bulkClearSelectionNotes() {
    if (selected.size === 0) return
    setBusy(true)
    try {
      const ids = [...selected]
      await Promise.all(ids.map((id) => api.updateClient(id, { notes: '' })))
      setClients((prev) =>
        prev.map((c) => (selected.has(c.id) ? { ...c, notes: '' } : c)),
      )
      setSelected(new Set())
      toast(`Cleared notes on ${ids.length} contact${ids.length === 1 ? '' : 's'}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk update failed', 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  function clearSearchAndFilters() {
    setToolbar((t) => ({
      ...t,
      query: '',
      activeIdentifier: 'All',
      filters: [] as FilterFlag[],
    }))
    setFilterOpen(false)
  }

  const showEmptyNoContacts = clients.length === 0
  const showNoMatches = !showEmptyNoContacts && filtered.length === 0

  const subtitle = showEmptyNoContacts
    ? 'No contacts yet'
    : showNoMatches
      ? '0 contacts shown'
      : `${filtered.length} of ${contacts.length} contacts shown${
          toolbar.groupBy !== 'none'
            ? ` · grouped by ${toolbar.groupBy === 'identifier' ? 'identifier' : 'account'}`
            : ''
        }`

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-w-0 bg-rinse-bg">
      <Header title="Contacts" subtitle={subtitle} />

      {showEmptyNoContacts ? (
        <EmptyNoContacts onAdd={() => void createContact({ navigate: false })} />
      ) : (
        <>
          <ContactsToolbar
            state={toolbar}
            setState={setToolbar}
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            groupOpen={groupOpen}
            setGroupOpen={setGroupOpen}
            onNewContact={() => void createContact({ navigate: false })}
            onClearNotes={() => void bulkClearSelectionNotes()}
            onClearSelection={() => setSelected(new Set())}
            busy={busy}
          />
          {showNoMatches ? (
            <EmptyNoMatches
              query={toolbar.query}
              filters={[
                ...(toolbar.activeIdentifier !== 'All' ? [toolbar.activeIdentifier] : []),
                ...toolbar.filters,
              ]}
              onClear={clearSearchAndFilters}
            />
          ) : (
            <ContactsTable
              contacts={paged}
              selected={selected}
              setSelected={setSelected}
              editingId={editingId}
              setEditingId={setEditingId}
              groupBy={toolbar.groupBy}
              businessAddress={businessAddress}
              busy={busy}
              totalFiltered={filtered.length}
              page={safePage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onSave={saveEdit}
              onDelete={deleteContact}
            />
          )}
        </>
      )}

      {(filterOpen || groupOpen) && (
        <button
          type="button"
          aria-label="Close menus"
          className="fixed inset-0 z-[25] cursor-default"
          onClick={() => {
            setFilterOpen(false)
            setGroupOpen(false)
          }}
        />
      )}
    </div>
  )
}
