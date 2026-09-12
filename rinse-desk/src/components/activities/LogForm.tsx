import { useEffect, useState } from 'react'
import { PencilLine, Save, X } from 'lucide-react'
import type { ActivityType } from '@/lib/types'
import { ACTIVITY_TYPES, TYPE_META, type ActivityRow } from './activityMeta'

export type ActivityFormState = {
  contactId: string
  dealId: string
  type: ActivityType
  subject: string
  body: string
}

export type ActivityContactOption = {
  id: string
  name: string
  kind: string
}

export type ActivityDealOption = {
  id: string
  label: string
  clientId?: string
}

const EMPTY: ActivityFormState = {
  contactId: '',
  dealId: '',
  type: 'call',
  subject: '',
  body: '',
}

type Props = {
  editingId: string | null
  draft: ActivityFormState
  onDraftChange: (d: ActivityFormState) => void
  onSave: () => void
  onCancel: () => void
  contacts: ActivityContactOption[]
  deals: ActivityDealOption[]
  saving?: boolean
}

export function LogForm({
  editingId,
  draft,
  onDraftChange,
  onSave,
  onCancel,
  contacts,
  deals,
  saving,
}: Props) {
  const isEditing = editingId !== null
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setTouched(false)
  }, [editingId])

  const contactValid = !!draft.contactId
  const subjectValid = draft.subject.trim().length > 0
  const canSave = contactValid && subjectValid && !saving

  const update = (patch: Partial<ActivityFormState>) => onDraftChange({ ...draft, ...patch })

  const contactDeals = deals.filter((d) => {
    if (!draft.contactId) return false
    // Keep the currently linked deal visible even if contact changed
    if (draft.dealId && d.id === draft.dealId) return true
    if (!d.clientId) return true
    return d.clientId === draft.contactId
  })

  const handleContact = (id: string) => {
    update({ contactId: id, dealId: '' })
  }

  const handleSave = () => {
    setTouched(true)
    if (!contactValid || !subjectValid || saving) return
    onSave()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink-200/70 px-5 pb-3.5 pt-5">
        <div className="flex items-center gap-2">
          <div
            className={[
              'grid h-7 w-7 place-items-center rounded-md transition-colors',
              isEditing ? 'bg-brand-100 text-brand-600' : 'bg-ink-900 text-white',
            ].join(' ')}
          >
            {isEditing ? <PencilLine className="h-3.5 w-3.5" /> : <PlusMini />}
          </div>
          <div>
            <h2 className="text-[14px] font-semibold leading-none text-ink-900">
              {isEditing ? 'Edit activity' : 'Log a touchpoint'}
            </h2>
            <p className="mt-1 text-[11.5px] leading-none text-ink-500">
              {isEditing ? 'Update this log entry' : 'Against a client, optionally a deal'}
            </p>
          </div>
        </div>
      </div>

      <div className="activities-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div>
          <FieldLabel>Type</FieldLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {ACTIVITY_TYPES.map((t) => {
              const meta = TYPE_META[t]
              const Icon = meta.icon
              const active = draft.type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ type: t })}
                  className={[
                    'flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] font-medium transition-all',
                    active
                      ? `${meta.iconBg} border-transparent ${meta.iconColor} shadow-card ring-2 ring-offset-0`
                      : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 hover:bg-ink-50',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <FieldLabel required>Contact</FieldLabel>
          <select
            value={draft.contactId}
            onChange={(e) => handleContact(e.target.value)}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-ink-900 outline-none transition-colors',
              touched && !contactValid
                ? 'border-red-300 focus:border-red-400'
                : 'border-ink-200 focus:border-brand-500',
            ].join(' ')}
          >
            <option value="">Select a client…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.kind}
              </option>
            ))}
          </select>
          {touched && !contactValid ? (
            <p className="mt-1 text-[11px] text-red-500">A client is required.</p>
          ) : null}
        </div>

        <div>
          <FieldLabel hint="optional">Deal</FieldLabel>
          <select
            value={draft.dealId}
            onChange={(e) => update({ dealId: e.target.value })}
            disabled={!draft.contactId}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 text-[13px] outline-none transition-colors',
              draft.contactId
                ? 'border-ink-200 text-ink-900 focus:border-brand-500'
                : 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400',
            ].join(' ')}
          >
            <option value="">No deal</option>
            {contactDeals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          {!draft.contactId ? (
            <p className="mt-1 text-[11px] text-ink-400">Pick a client to link a deal.</p>
          ) : null}
        </div>

        <div>
          <FieldLabel required>Subject</FieldLabel>
          <input
            value={draft.subject}
            onChange={(e) => update({ subject: e.target.value })}
            placeholder="e.g. Follow-up ceramic quote"
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-ink-900 placeholder-ink-400 outline-none transition-colors',
              touched && !subjectValid
                ? 'border-red-300 focus:border-red-400'
                : 'border-ink-200 focus:border-brand-500',
            ].join(' ')}
          />
          {touched && !subjectValid ? (
            <p className="mt-1 text-[11px] text-red-500">Add a short subject.</p>
          ) : null}
        </div>

        <div>
          <FieldLabel hint="optional">Notes</FieldLabel>
          <textarea
            value={draft.body}
            onChange={(e) => update({ body: e.target.value })}
            rows={5}
            placeholder="What happened on this touchpoint?"
            className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-ink-900 placeholder-ink-400 outline-none transition-colors focus:border-brand-500"
          />
        </div>
      </div>

      <div className="rounded-b-2xl border-t border-ink-200/70 bg-ink-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={[
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all',
              canSave
                ? 'bg-brand-500 text-white shadow-card hover:bg-brand-600'
                : 'cursor-not-allowed bg-brand-100 text-brand-700/50',
            ].join(' ')}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save activity'}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-[13px] font-medium text-ink-600 transition-colors hover:bg-ink-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-600">
        {children}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </label>
      {hint ? (
        <span className="text-[10.5px] lowercase tracking-normal text-ink-400">{hint}</span>
      ) : null}
    </div>
  )
}

function PlusMini() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function activityToForm(a: ActivityRow): ActivityFormState {
  return {
    contactId: a.contactId,
    dealId: a.dealId ?? '',
    type: a.type,
    subject: a.subject,
    body: a.body,
  }
}

export function emptyForm(): ActivityFormState {
  return { ...EMPTY }
}
