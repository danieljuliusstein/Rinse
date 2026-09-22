import { useEffect, useRef, useState } from 'react'
import { Check, MapPin, Trash2, X } from 'lucide-react'
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput'
import { CategoryColorControls } from '@/components/calendar/CategoryColorControls'
import {
  ClientInviteePicker,
  type EventPopoverModel,
} from '@/components/calendar/EventPopover'
import type { CalCategory } from '@/lib/calendar-categories'
import { geocodeAddressOnce } from '@/lib/geocode-once'
import type { DeskClient, DeskPackage } from '@/lib/types'
import type { GeocodeHit } from '@/lib/route-api'
import { colors } from '@/theme/colors'
import { PanelEdgeToggle } from '@/components/automations/PanelEdgeToggle'

type Props = {
  model: EventPopoverModel
  clients: DeskClient[]
  packages: DeskPackage[]
  categories: CalCategory[]
  saving?: boolean
  businessAddress?: string
  headingRef?: React.RefObject<HTMLHeadingElement | null>
  titleInputRef?: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  onChangeTitle: (title: string) => void
  onChangeClient: (clientId: string) => void
  onChangePackage: (packageId: string) => void
  onChangeDate: (date: string) => void
  onChangeTime: (time: string) => void
  onChangeDuration: (hours: number) => void
  onChangeCategory: (categoryId: string) => void
  onChangeColor: (color: string) => void
  onCategoriesChange: (cats: CalCategory[]) => void
  asBlocked?: boolean
  onChangeAsBlocked?: (blocked: boolean) => void
  onChangeLocation: (next: {
    address: string
    lat?: number | null
    lng?: number | null
  }) => void | Promise<void>
  onSave: () => void
  onDelete?: () => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function durationLabel(hours: number) {
  if (hours === 0.5) return '30 min'
  if (hours === 1) return '1 hr'
  if (Number.isInteger(hours)) return `${hours} hrs`
  return `${hours} hrs`
}

function timeOptions(): string[] {
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${pad(h)}:${pad(m)}`)
    }
  }
  return out
}

function formatTimeOption(hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(':').map(Number)
  const h = hRaw ?? 0
  const m = mRaw ?? 0
  const am = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${pad(m)} ${am}`
}

const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]

export function EventDetailSidebar({
  model,
  clients,
  packages,
  categories,
  saving,
  businessAddress,
  headingRef,
  titleInputRef,
  onClose,
  onChangeTitle,
  onChangeClient,
  onChangePackage,
  onChangeDate,
  onChangeTime,
  onChangeDuration,
  onChangeCategory,
  onChangeColor,
  onCategoriesChange,
  asBlocked = false,
  onChangeAsBlocked,
  onChangeLocation,
  onSave,
  onDelete,
}: Props) {
  const selectedCategory = categories.find((c) => c.id === model.categoryId) ?? categories[0]
  const selectedClient = clients.find((c) => c.id === model.clientId)
  const activePackages = packages.filter((p) => p.active)
  const packageOptions = activePackages.length ? activePackages : packages

  const [inviteeOpen, setInviteeOpen] = useState(false)
  const [locationDraft, setLocationDraft] = useState(selectedClient?.address?.trim() ?? '')
  const [locationPinned, setLocationPinned] = useState(
    Boolean(selectedClient?.lat != null && selectedClient?.lng != null),
  )
  const [locationSaving, setLocationSaving] = useState(false)
  const [allDay, setAllDay] = useState(model.allDay || !model.time)
  const titleLocal = useRef(model.title)

  useEffect(() => {
    titleLocal.current = model.title
  }, [model.id, model.title])

  useEffect(() => {
    setLocationDraft(selectedClient?.address?.trim() ?? '')
    setLocationPinned(Boolean(selectedClient?.lat != null && selectedClient?.lng != null))
  }, [model.clientId, selectedClient?.address, selectedClient?.lat, selectedClient?.lng])

  useEffect(() => {
    setAllDay(model.allDay || !model.time)
  }, [model.id, model.allDay, model.time])

  async function persistLocation(address: string, geo?: GeocodeHit | null) {
    if (!model.clientId) return
    setLocationSaving(true)
    try {
      const trimmed = address.trim()
      if (geo) {
        await onChangeLocation({ address: trimmed, lat: geo.lat, lng: geo.lng })
        setLocationPinned(true)
      } else if (geo === null) {
        if (trimmed) {
          const hit = await geocodeAddressOnce(trimmed, { context: businessAddress })
          if (hit) {
            await onChangeLocation({ address: trimmed, lat: hit.lat, lng: hit.lng })
            setLocationPinned(true)
          } else {
            await onChangeLocation({ address: trimmed, lat: null, lng: null })
            setLocationPinned(false)
          }
        } else {
          await onChangeLocation({ address: trimmed, lat: null, lng: null })
          setLocationPinned(false)
        }
      } else {
        await onChangeLocation({ address: trimmed })
      }
      setLocationDraft(trimmed)
    } finally {
      setLocationSaving(false)
    }
  }

  function commitTitle() {
    const next = titleLocal.current.trim() || 'New event'
    if (next !== model.title) onChangeTitle(next)
  }

  function toggleAllDay(checked: boolean) {
    setAllDay(checked)
    if (checked) {
      onChangeTime('')
      onChangeDuration(0)
    } else {
      onChangeTime(model.time || '09:00')
      onChangeDuration(model.hoursWorked > 0 ? model.hoursWorked : 1)
    }
  }

  return (
    <aside
      className="relative w-[360px] shrink-0 flex flex-col overflow-hidden border-l border-ink-200 bg-white shadow-card"
      aria-label={model.isDraft ? 'New event' : 'Edit event'}
    >
      <PanelEdgeToggle side="right" expanded onToggle={onClose} label="event details" />

      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: selectedCategory?.color ?? model.color }}
          />
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-[15px] font-semibold text-ink-900 outline-none truncate"
          >
            {model.isDraft ? 'New event' : 'Edit event'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
            Title
          </span>
          <input
            ref={titleInputRef}
            type="text"
            key={`${model.id}-title`}
            defaultValue={model.title}
            placeholder="e.g. Ceramic coat — black SUV"
            onChange={(e) => {
              titleLocal.current = e.target.value
            }}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-full h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>

        <CategoryColorControls
          categories={categories}
          categoryId={model.categoryId}
          color={model.color}
          onChangeCategory={onChangeCategory}
          onChangeColor={onChangeColor}
          onCategoriesChange={onCategoriesChange}
        />

        <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink-600">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => toggleAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            All day
          </label>
          {!allDay ? (
            <span className="text-[12px] text-ink-400">
              {durationLabel(model.hoursWorked || 1)}
            </span>
          ) : null}
        </div>

        {onChangeAsBlocked ? (
          <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={asBlocked}
              onChange={(e) => onChangeAsBlocked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-slate-600 focus:ring-slate-500"
            />
            <span>
              <span className="block text-[13px] font-medium text-ink-800">Blocked time</span>
              <span className="block text-[11.5px] text-ink-500 leading-snug">
                {model.isDraft
                  ? 'Save as unavailable / time off (grays this slot). No client required.'
                  : 'Convert this event into blocked time and remove the job.'}
              </span>
            </span>
          </label>
        ) : null}

        {!asBlocked ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              Client
            </span>
            <div className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 min-h-9">
              <ClientInviteePicker
                clients={clients}
                value={model.clientId}
                onChange={onChangeClient}
                inputId={`cal-side-client-${model.id}`}
                open={inviteeOpen}
                onOpenChange={setInviteeOpen}
              />
            </div>
          </div>
          <label className="block min-w-0">
            <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              Package
            </span>
            <select
              value={model.packageId}
              onChange={(e) => onChangePackage(e.target.value)}
              className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">— none —</option>
              {packageOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.base_price ? ` · $${p.base_price}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
            Date
          </span>
          <input
            type="date"
            value={model.date.slice(0, 10)}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>

        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Starts
              </span>
              <select
                value={model.time || '09:00'}
                onChange={(e) => onChangeTime(e.target.value)}
                className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {timeOptions().map((t) => (
                  <option key={t} value={t}>
                    {formatTimeOption(t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Duration
              </span>
              <select
                value={model.hoursWorked || 1}
                onChange={(e) => onChangeDuration(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {durationLabel(d)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {!asBlocked ? (
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              Location
            </span>
            <span className="text-[11px] text-ink-400">optional</span>
          </div>
          {!model.clientId ? (
            <button
              type="button"
              onClick={() => setInviteeOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-ink-200 px-3 py-2 text-left text-[13px] text-ink-400 hover:border-brand-300 hover:text-brand-700"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              Pick a contact first
            </button>
          ) : (
            <div className="relative">
              <AddressAutocompleteInput
                compact
                requireStructuredManual
                value={locationDraft}
                initiallyPinned={locationPinned}
                context={businessAddress}
                aria-label="Location"
                placeholder="Street address"
                onChange={(address) => {
                  setLocationDraft(address)
                  setLocationPinned(false)
                }}
                onPickSuggestion={(hit) => {
                  setLocationDraft(hit.display_name)
                  void persistLocation(hit.display_name, hit)
                }}
              />
              {locationDraft !== (selectedClient?.address?.trim() ?? '') ? (
                <button
                  type="button"
                  disabled={locationSaving}
                  onClick={() =>
                    void persistLocation(locationDraft, locationPinned ? undefined : null)
                  }
                  className="mt-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                >
                  {locationSaving ? 'Saving…' : 'Save location'}
                </button>
              ) : null}
            </div>
          )}
        </div>
        ) : null}

        {model.isDraft ? (
          <div className="rounded-lg bg-ink-50 px-3 py-2 text-[11.5px] text-ink-400">
            Drafts don&apos;t save until you hit{' '}
            <span className="font-semibold text-ink-500">Save</span>. Esc to discard.
          </div>
        ) : (
          <div className="space-y-2">
            {(model.depositStatus === 'paid' ||
              (model.depositAmount != null && model.depositAmount > 0)) && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-xs">
                <span className="font-medium text-emerald-800">
                  Deposit{' '}
                  {model.depositStatus === 'paid'
                    ? 'Paid'
                    : model.depositStatus === 'waived'
                      ? 'Waived'
                      : 'Due'}
                </span>
                <span className="font-semibold text-emerald-900 tabular-nums">
                  ${(model.depositAmount ?? 0).toFixed(2)}
                </span>
              </div>
            )}
            {model.tip != null && model.tip > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-purple-50 border border-purple-200/70 px-3 py-2 text-xs">
                <span className="font-medium text-purple-800">Tip received</span>
                <span className="font-semibold text-purple-900 tabular-nums">
                  +${model.tip.toFixed(2)}
                </span>
              </div>
            )}
            <p className="text-[11px] text-ink-400">{model.statusLabel}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-ink-100 px-4 py-3 shrink-0">
        {onDelete ? (
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            aria-label="Delete event"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
        <div className="flex-1" />
        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          className="h-9 px-3 rounded-lg text-sm font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            commitTitle()
            onSave()
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
          style={{ background: colors.green }}
        >
          <Check className="h-4 w-4" />
          {saving ? 'Saving…' : asBlocked ? (model.isDraft ? 'Block time' : 'Convert') : 'Save'}
        </button>
      </div>
    </aside>
  )
}
