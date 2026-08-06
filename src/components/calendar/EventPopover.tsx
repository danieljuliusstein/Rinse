import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconPackage,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react'
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput'
import { CategoryColorControls } from '@/components/calendar/CategoryColorControls'
import type { CalCategory } from '@/lib/calendar-categories'
import type { DeskClient, DeskPackage } from '@/lib/types'
import type { GeocodeHit } from '@/lib/route-api'
import { colors } from '@/theme/colors'

const INVITEE_VISIBLE = 8

function clientMatchesQuery(c: DeskClient, q: string) {
  if (!q) return true
  return [c.name, c.email, c.phone, c.address].some((f) => f?.toLowerCase().includes(q))
}

export function ClientInviteePicker({
  clients,
  value,
  onChange,
  inputId,
  open: openProp,
  onOpenChange,
}: {
  clients: DeskClient[]
  value: string
  onChange: (clientId: string) => void
  inputId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  const controlled = openProp !== undefined
  const open = controlled ? openProp : internalOpen
  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const selected = clients.find((c) => c.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = clients.filter((c) => clientMatchesQuery(c, q))
    // Prefer exact/prefix name matches when searching
    if (!q) return list
    return [...list].sort((a, b) => {
      const an = a.name.toLowerCase()
      const bn = b.name.toLowerCase()
      const aPrefix = an.startsWith(q) ? 0 : 1
      const bPrefix = bn.startsWith(q) ? 0 : 1
      if (aPrefix !== bPrefix) return aPrefix - bPrefix
      return an.localeCompare(bn)
    })
  }, [clients, query])

  const visible = filtered.slice(0, INVITEE_VISIBLE)
  const hiddenCount = Math.max(0, filtered.length - visible.length)

  useEffect(() => {
    if (!open) return
    setActiveIdx(0)
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function pick(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function clear() {
    onChange('')
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setQuery('')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, visible.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const hit = visible[activeIdx]
      if (hit) pick(hit.id)
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          id={inputId}
          aria-haspopup="listbox"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
        >
          <span
            className={`text-[13px] truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
          >
            {selected ? selected.name : 'Add Invitees'}
          </span>
          <IconChevronDown size={14} stroke={1.75} className="text-gray-400 shrink-0" aria-hidden />
        </button>
        {selected && (
          <button
            type="button"
            aria-label="Clear contact"
            onClick={clear}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 shrink-0"
          >
            <IconX size={12} stroke={2} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="min-w-0 flex-1" onKeyDown={onKeyDown}>
      <div className="flex items-center gap-1.5 rounded-lg border border-green-500/60 bg-white px-2 py-1 focus-within:ring-2 focus-within:ring-green-500/30">
        <IconSearch size={13} stroke={1.75} className="text-gray-400 shrink-0" aria-hidden />
        <input
          ref={searchRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={`${inputId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={visible[activeIdx] ? `${inputId}-opt-${visible[activeIdx].id}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIdx(0)
          }}
          placeholder={selected ? selected.name : 'Search contacts…'}
          className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 outline-none"
        />
        <button
          type="button"
          aria-label="Close contact search"
          onClick={() => {
            setOpen(false)
            setQuery('')
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700"
        >
          <IconX size={12} stroke={2} />
        </button>
      </div>

      <ul
        id={`${inputId}-list`}
        role="listbox"
        aria-label="Contacts"
        className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1"
      >
        {visible.length === 0 ? (
          <li className="px-3 py-2.5 text-[12px] text-gray-500">
            {clients.length === 0
              ? 'No contacts yet — add one in Contacts.'
              : 'No matches. Try a name, phone, or email.'}
          </li>
        ) : (
          visible.map((c, i) => {
            const active = i === activeIdx
            const isSelected = c.id === value
            return (
              <li key={c.id} role="presentation">
                <button
                  type="button"
                  id={`${inputId}-opt-${c.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(c.id)}
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    active ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600 flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      {c.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? '')
                        .join('') || '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-gray-900 truncate">
                        {c.name}
                      </span>
                      {(c.phone || c.email) && (
                        <span className="block text-[11px] text-gray-500 truncate">
                          {[c.phone, c.email].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-green-700 shrink-0">Selected</span>
                    )}
                  </div>
                </button>
              </li>
            )
          })
        )}
        {hiddenCount > 0 && (
          <li className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
            {hiddenCount} more — keep typing to narrow
          </li>
        )}
      </ul>
    </div>
  )
}

export type EventPopoverModel = {
  id: string
  title: string
  date: string
  time?: string
  allDay: boolean
  hoursWorked: number
  clientId: string
  packageId: string
  notes: string
  categoryId: string
  color: string
  statusLabel: string
  isDraft: boolean
}

type Props = {
  model: EventPopoverModel
  clients: DeskClient[]
  packages: DeskPackage[]
  categories: CalCategory[]
  saving?: boolean
  calendarRoot: HTMLElement | null
  headingRef?: React.RefObject<HTMLHeadingElement | null>
  titleInputRef?: React.RefObject<HTMLInputElement | null>
  /** Bias address suggestions (shop / business address). */
  businessAddress?: string
  onClose: () => void
  onChangeTitle: (title: string) => void
  onChangeClient: (clientId: string) => void
  onChangePackage: (packageId: string) => void
  onChangeDate: (date: string) => void
  onChangeTime: (time: string) => void
  onChangeDuration: (hours: number) => void
  onChangeNotes: (notes: string) => void
  onChangeCategory: (categoryId: string) => void
  onChangeColor: (color: string) => void
  onCategoriesChange: (cats: CalCategory[]) => void
  asBlocked?: boolean
  onChangeAsBlocked?: (blocked: boolean) => void
  /** Persist location on the selected contact (jobs use client.address). */
  onChangeLocation: (next: {
    address: string
    lat?: number | null
    lng?: number | null
  }) => void | Promise<void>
  onSave: () => void
  onDelete?: () => void
}

type AnchorPlacement = {
  style: CSSProperties
  arrow: 'left' | 'right'
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const
const POP_W = 360

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1)
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function endTimeFrom(start: string | undefined, hours: number): string | null {
  if (!start) return null
  const [h, m] = start.split(':').map(Number)
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return null
  const total = h * 60 + m + Math.round(hours * 60)
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${pad(eh)}:${pad(em)}`
}

function formatTimeLabel(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(':').map(Number)
  const h = hRaw ?? 0
  const m = mRaw ?? 0
  const am = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${pad(m)}${am}`
}

function formatLongDate(iso: string): string {
  const d = parseISODate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatEventRangeLabel(
  model: Pick<EventPopoverModel, 'date' | 'time' | 'allDay' | 'hoursWorked'>,
): string {
  const datePart = formatLongDate(model.date)
  if (model.allDay || !model.time) return `${datePart} · All day`
  const end = endTimeFrom(model.time, model.hoursWorked || 1)
  const startLabel = formatTimeLabel(model.time)
  const endLabel = end ? formatTimeLabel(end) : null
  return endLabel ? `${datePart} ${startLabel} – ${endLabel}` : `${datePart} ${startLabel}`
}

function measurePlacement(anchor: DOMRect, popW: number, popH: number): AnchorPlacement {
  const gap = 12
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  let arrow: 'left' | 'right' = 'left'
  let left = anchor.right + gap
  if (left + popW > vw - margin) {
    left = anchor.left - gap - popW
    arrow = 'right'
  }
  if (left < margin) left = margin

  let top = anchor.top + anchor.height / 2 - popH / 2
  top = Math.max(margin, Math.min(top, vh - popH - margin))

  return { style: { position: 'fixed', top, left, width: popW, zIndex: 60 }, arrow }
}

function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden divide-y divide-gray-100/80">
      {children}
    </div>
  )
}

function FieldCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-3.5 py-2.5 ${className}`}>{children}</div>
}

function MiniMonth({
  selectedISO,
  onSelect,
}: {
  selectedISO: string
  onSelect: (iso: string) => void
}) {
  const selected = parseISODate(selectedISO)
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))

  useEffect(() => {
    setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [selectedISO])

  const todayISO = toISODate(new Date())
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevDays = new Date(year, month, 0).getDate()
    const out: { iso: string; day: number; inMonth: boolean }[] = []

    for (let i = 0; i < firstDow; i++) {
      const day = prevDays - firstDow + 1 + i
      const d = new Date(year, month - 1, day)
      out.push({ iso: toISODate(d), day, inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      out.push({ iso: toISODate(new Date(year, month, day)), day, inMonth: true })
    }
    while (out.length % 7 !== 0 || out.length < 35) {
      const day = out.length - (firstDow + daysInMonth) + 1
      const d = new Date(year, month + 1, day)
      out.push({ iso: toISODate(d), day, inMonth: false })
    }
    return out
  }, [cursor])

  return (
    <div className="px-1 pb-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold text-gray-800 tracking-tight">{monthLabel}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <IconChevronLeft size={16} stroke={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date()
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
              onSelect(toISODate(now))
            }}
            className="px-2 h-7 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <IconChevronRight size={16} stroke={1.75} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell) => {
          const isSelected = cell.iso === selectedISO
          const isToday = cell.iso === todayISO
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              className={`mx-auto w-8 h-8 text-[12px] rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? 'text-white font-semibold'
                  : cell.inMonth
                    ? isToday
                      ? 'text-green-700 font-semibold'
                      : 'text-gray-800'
                    : 'text-gray-300'
              } ${!isSelected ? 'hover:bg-gray-100' : ''}`}
              style={isSelected ? { background: colors.green } : undefined}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EventPopover({
  model,
  clients,
  packages,
  categories,
  saving,
  calendarRoot,
  headingRef,
  titleInputRef,
  businessAddress,
  onClose,
  onChangeTitle,
  onChangeClient,
  onChangePackage,
  onChangeDate,
  onChangeTime,
  onChangeDuration,
  onChangeNotes,
  onChangeCategory,
  onChangeColor,
  onCategoriesChange,
  asBlocked = false,
  onChangeAsBlocked,
  onChangeLocation,
  onSave,
  onDelete,
}: Props) {
  const popRef = useRef<HTMLDivElement | null>(null)
  const [placement, setPlacement] = useState<AnchorPlacement>({
    style: { position: 'fixed', top: 80, left: 80, width: POP_W, zIndex: 60 },
    arrow: 'left',
  })
  const [showWhen, setShowWhen] = useState(false)
  const [inviteeOpen, setInviteeOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationDraft, setLocationDraft] = useState('')
  const [locationPinned, setLocationPinned] = useState(false)
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationHint, setLocationHint] = useState<string | null>(null)

  const activePackages = packages.filter((p) => p.active)
  const packageOptions = activePackages.length ? activePackages : packages
  const selectedClient = clients.find((c) => c.id === model.clientId)
  const selectedCategory = categories.find((c) => c.id === model.categoryId) ?? categories[0]
  const endTime = endTimeFrom(model.time, model.hoursWorked || 1)
  const timeRangeLabel =
    model.allDay || !model.time
      ? 'All day'
      : endTime
        ? `${formatTimeLabel(model.time)} – ${formatTimeLabel(endTime)}`
        : formatTimeLabel(model.time)

  useEffect(() => {
    setLocationDraft(selectedClient?.address?.trim() ?? '')
    setLocationPinned(Boolean(selectedClient?.lat != null && selectedClient?.lng != null))
    setEditingLocation(false)
    setLocationHint(null)
  }, [model.clientId, selectedClient?.address, selectedClient?.lat, selectedClient?.lng])

  async function persistLocation(address: string, geo?: GeocodeHit | null) {
    if (!model.clientId) return
    setLocationSaving(true)
    setLocationHint(null)
    try {
      const trimmed = address.trim()
      if (geo) {
        await onChangeLocation({ address: trimmed, lat: geo.lat, lng: geo.lng })
        setLocationPinned(true)
      } else if (geo === null) {
        await onChangeLocation({ address: trimmed, lat: null, lng: null })
        setLocationPinned(false)
      } else {
        await onChangeLocation({ address: trimmed })
      }
      setLocationDraft(trimmed)
      setEditingLocation(false)
    } catch {
      setLocationHint('Could not save location')
    } finally {
      setLocationSaving(false)
    }
  }

  function reposition() {
    const root = calendarRoot
    const el =
      (root?.querySelector(`[data-cal-event-id="${CSS.escape(model.id)}"]`) as HTMLElement | null) ??
      (document.querySelector(`[data-cal-event-id="${CSS.escape(model.id)}"]`) as HTMLElement | null)
    const pop = popRef.current
    if (!pop) return
    if (!el) {
      const popW = pop.offsetWidth || POP_W
      const popH = pop.offsetHeight || 520
      setPlacement({
        style: {
          position: 'fixed',
          top: Math.max(24, (window.innerHeight - popH) / 2),
          left: Math.max(16, (window.innerWidth - popW) / 2),
          width: popW,
          zIndex: 60,
        },
        arrow: 'left',
      })
      return
    }
    const rect = el.getBoundingClientRect()
    const popW = pop.offsetWidth || POP_W
    const popH = pop.offsetHeight || 520
    setPlacement(measurePlacement(rect, popW, popH))
  }

  useLayoutEffect(() => {
    reposition()
    const t = window.setTimeout(reposition, 30)
    const pop = popRef.current
    const ro =
      typeof ResizeObserver !== 'undefined' && pop
        ? new ResizeObserver(() => reposition())
        : null
    if (pop && ro) ro.observe(pop)
    return () => {
      window.clearTimeout(t)
      ro?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reposition reads latest model/dom
  }, [model.id, model.date, model.time, model.hoursWorked, model.allDay, showWhen, editingLocation, inviteeOpen, calendarRoot])

  useEffect(() => {
    const onMove = () => reposition()
    window.addEventListener('resize', onMove)
    const scrollers = calendarRoot?.querySelectorAll('.fc-scroller') ?? []
    scrollers.forEach((s) => s.addEventListener('scroll', onMove, { passive: true }))
    document.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      scrollers.forEach((s) => s.removeEventListener('scroll', onMove))
      document.removeEventListener('scroll', onMove, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.id, calendarRoot])

  useEffect(() => {
    const openedAt = Date.now()
    function onDocDown(e: MouseEvent) {
      if (Date.now() - openedAt < 400) return
      const t = e.target as HTMLElement | null
      if (!t) return
      if (popRef.current?.contains(t)) return
      if (t.closest?.('[data-cal-event-id]')) return
      if (t.closest?.('select')) return
      onClose()
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [model.id, onClose])

  function applyEndTime(nextEnd: string) {
    if (!model.time) {
      onChangeTime(nextEnd)
      onChangeDuration(1)
      return
    }
    const [sh, sm] = model.time.split(':').map(Number)
    const [eh, em] = nextEnd.split(':').map(Number)
    if ([sh, sm, eh, em].some((n) => n == null || Number.isNaN(n))) return
    let mins = (eh! * 60 + em!) - (sh! * 60 + sm!)
    if (mins <= 0) mins = 60
    onChangeDuration(Math.round((mins / 60) * 4) / 4)
  }

  // Title field owns job.notes in this app (Calendar maps notes → title).
  void onChangeNotes

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label={model.isDraft ? 'New event' : 'Event details'}
      style={placement.style}
      className="rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-black/12 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-gray-200 rotate-45"
        style={
          placement.arrow === 'left'
            ? { left: -5, borderLeftWidth: 1, borderBottomWidth: 1 }
            : { right: -5, borderRightWidth: 1, borderTopWidth: 1 }
        }
      />

      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <MiniMonth selectedISO={model.date} onSelect={onChangeDate} />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-green-500 shrink-0"
        >
          <IconX size={16} stroke={1.75} />
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2.5">
        <h3 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          {model.isDraft ? 'New event' : 'Event details'}
        </h3>

        <FieldShell>
          <FieldCell className="flex items-center gap-2">
            <input
              ref={titleInputRef}
              type="text"
              defaultValue={model.title}
              key={`${model.id}-title`}
              placeholder="New Event"
              onBlur={(e) => {
                const next = e.target.value.trim() || 'New event'
                if (next !== model.title) onChangeTitle(next)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className="flex-1 min-w-0 bg-transparent text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0 max-w-[42%]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: model.color || selectedCategory?.color }}
              />
              <span className="text-[11px] font-medium text-gray-600 truncate max-w-[120px]">
                {selectedCategory?.name ?? 'Category'}
              </span>
            </div>
          </FieldCell>

          <FieldCell>
            <CategoryColorControls
              compact
              categories={categories}
              categoryId={model.categoryId}
              color={model.color}
              onChangeCategory={onChangeCategory}
              onChangeColor={onChangeColor}
              onCategoriesChange={onCategoriesChange}
            />
          </FieldCell>

          <FieldCell className="flex items-start gap-2">
            <IconMapPin size={15} stroke={1.75} className="text-gray-400 shrink-0 mt-0.5" />
            {!model.clientId ? (
              <button
                type="button"
                onClick={() => {
                  setLocationHint('Pick a contact first — location is saved on the contact.')
                  setInviteeOpen(true)
                }}
                className="flex-1 min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
              >
                <span className="text-[13px] text-gray-400">Add Location</span>
                {locationHint && (
                  <span className="mt-0.5 block text-[11px] text-amber-700">{locationHint}</span>
                )}
              </button>
            ) : editingLocation ? (
              <div className="min-w-0 flex-1 space-y-1.5">
                <AddressAutocompleteInput
                  compact
                  requireStructuredManual
                  value={locationDraft}
                  initiallyPinned={locationPinned}
                  context={businessAddress}
                  aria-label="Location"
                  placeholder="Start typing an address…"
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 outline-none focus:border-green-500"
                  onChange={(address) => {
                    setLocationDraft(address)
                    setLocationPinned(false)
                  }}
                  onPickSuggestion={(hit) => {
                    setLocationDraft(hit.display_name)
                    void persistLocation(hit.display_name, hit)
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={locationSaving}
                    onClick={() => void persistLocation(locationDraft, locationPinned ? undefined : null)}
                    className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg disabled:opacity-60"
                    style={{ background: colors.green }}
                  >
                    {locationSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={locationSaving}
                    onClick={() => {
                      setEditingLocation(false)
                      setLocationDraft(selectedClient?.address?.trim() ?? '')
                      setLocationHint(null)
                    }}
                    className="text-[11px] font-medium text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
                {locationHint && (
                  <p className="text-[11px] text-red-600">{locationHint}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingLocation(true)
                  setLocationHint(null)
                }}
                className="flex-1 min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
              >
                <span
                  className={`text-[13px] block truncate ${
                    selectedClient?.address?.trim() ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {selectedClient?.address?.trim() || 'Add Location'}
                </span>
              </button>
            )}
          </FieldCell>

          <FieldCell>
            <button
              type="button"
              onClick={() => setShowWhen((v) => !v)}
              className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-gray-900 leading-snug truncate">
                  {formatLongDate(model.date)}
                </span>
                <span className="text-[13px] font-medium text-gray-600 shrink-0 tabular-nums">
                  {timeRangeLabel}
                </span>
              </div>
            </button>
            {showWhen && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <label className="col-span-2 block space-y-1">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Start</span>
                  <input
                    type="time"
                    value={model.time || ''}
                    onChange={(e) => onChangeTime(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 outline-none focus:border-green-500"
                  />
                </label>
                <label className="col-span-2 block space-y-1">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">End</span>
                  <input
                    type="time"
                    value={endTime || ''}
                    onChange={(e) => applyEndTime(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 outline-none focus:border-green-500"
                  />
                </label>
              </div>
            )}
            {!model.isDraft && !showWhen && (
              <div className="mt-1 text-[11px] text-gray-400">{model.statusLabel}</div>
            )}
          </FieldCell>

          <FieldCell className="flex items-start gap-2">
            <IconUser size={15} stroke={1.75} className="text-gray-400 shrink-0 mt-0.5" />
            <label className="sr-only" htmlFor={`cal-pop-client-${model.id}`}>
              Contact
            </label>
            <ClientInviteePicker
              clients={clients}
              value={model.clientId}
              onChange={(clientId) => {
                onChangeClient(clientId)
                setLocationHint(null)
              }}
              inputId={`cal-pop-client-${model.id}`}
              open={inviteeOpen}
              onOpenChange={setInviteeOpen}
            />
          </FieldCell>

          <FieldCell className="flex items-center gap-2">
            <IconPackage size={15} stroke={1.75} className="text-gray-400 shrink-0" />
            <label className="sr-only" htmlFor={`cal-pop-pkg-${model.id}`}>
              Package
            </label>
            <select
              id={`cal-pop-pkg-${model.id}`}
              value={model.packageId}
              onChange={(e) => onChangePackage(e.target.value)}
              className="w-full bg-transparent text-[13px] text-gray-900 outline-none cursor-pointer"
            >
              <option value="">Select package…</option>
              {packageOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.base_price ? ` · $${p.base_price}` : ''}
                </option>
              ))}
            </select>
          </FieldCell>
        </FieldShell>

        {onChangeAsBlocked ? (
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={asBlocked}
              onChange={(e) => onChangeAsBlocked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            />
            <span>
              <span className="block text-[13px] font-medium text-gray-900">Blocked time</span>
              <span className="block text-[11px] text-gray-500 leading-snug">
                {model.isDraft
                  ? 'Save as time off — grays this slot. No client needed.'
                  : 'Convert to blocked time and remove this job.'}
              </span>
            </span>
          </label>
        ) : null}

        <div className="flex gap-2 pt-0.5">
          {model.isDraft ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-60"
                style={{ background: colors.green }}
              >
                {saving ? 'Saving…' : asBlocked ? 'Block time' : 'Save'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-60"
                style={{ background: colors.green }}
              >
                {saving ? 'Saving…' : asBlocked ? 'Convert' : 'Done'}
              </button>
              {onDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onDelete}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
