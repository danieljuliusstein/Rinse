import { useState, type ReactNode } from 'react'
import type { DeskChatThread, DeskClient } from '@/lib/types'
import { colors, IDENTIFIER_STYLES } from '@/theme/colors'
import { readIdentifier } from '@/lib/contact-identifier'
import { avatarTone, initialsFromName } from './chatUtils'

type Props = {
  thread: DeskChatThread | null
  contact: DeskClient | null
  clients: DeskClient[]
  onLinkContact: (contactId: string) => void
  onAddNote: () => void
  onCreateTask: () => void
  onOpenCalendar: () => void
  onOpenContact: () => void
  onCreateDeal: () => void
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50"
        onClick={onToggle}
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function DetailRow({ label, value, icon }: { label: string; value?: string; icon?: ReactNode }) {
  return (
    <div
      className="flex justify-between items-center text-xs py-2"
      style={{ borderBottom: `1px solid ${colors.borderSubtle}`, color: colors.textSecondary }}
    >
      <span className="flex items-center gap-1.5" style={{ color: colors.textMuted }}>
        {icon}
        {label}
      </span>
      <span>{value?.trim() || '—'}</span>
    </div>
  )
}

export function ContactPanel({
  thread,
  contact,
  clients,
  onLinkContact,
  onAddNote,
  onCreateTask,
  onOpenCalendar,
  onOpenContact,
  onCreateDeal,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [prefsOpen, setPrefsOpen] = useState(false)

  if (!thread) {
    return (
      <aside
        className="h-full border-l bg-white flex items-center justify-center p-4"
        style={{ borderColor: colors.border }}
      >
        <p className="text-xs text-gray-400 text-center">Select a conversation to see contact details</p>
      </aside>
    )
  }

  const name = contact?.name ?? thread.visitor_name
  const email = contact?.email ?? thread.visitor_email
  const tone = avatarTone(contact?.id ?? thread.id)
  const identifier = contact ? readIdentifier(contact) : 'Prospect'
  const idStyle = IDENTIFIER_STYLES[identifier]

  return (
    <aside
      className="h-full border-l bg-white overflow-auto flex flex-col"
      style={{ borderColor: colors.border }}
    >
      <div className="px-4 pt-5 pb-4 text-center">
        <div
          className="w-[52px] h-[52px] rounded-full mx-auto flex items-center justify-center text-base font-semibold mb-2.5"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {initialsFromName(name)}
        </div>
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium mt-1.5"
          style={{ background: idStyle.bg, color: idStyle.text }}
        >
          {identifier}
        </span>
      </div>

      <div className="flex justify-center gap-3 px-4 pb-4">
        {(
          [
            { label: 'Note', onClick: onAddNote, node: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></> },
            {
              label: 'Email',
              onClick: () => {
                if (email) window.location.href = `mailto:${email}`
              },
              node: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
            },
            { label: 'Task', onClick: onCreateTask, node: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
            { label: 'Meet', onClick: onOpenCalendar, node: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
            { label: 'More', onClick: onOpenContact, node: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></> },
          ] as const
        ).map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-800"
            title={a.label}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {a.node}
              </svg>
            </span>
            <span className="text-[9px] font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      {!contact && (
        <div className="px-4 pb-3">
          <label className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Link contact
          </label>
          <select
            className="mt-1 w-full text-xs rounded-lg px-2 py-1.5"
            style={{ border: `1px solid ${colors.border}` }}
            value=""
            onChange={(e) => {
              if (e.target.value) onLinkContact(e.target.value)
            }}
          >
            <option value="">Select contact…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Section title="Contact Details" open={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
        <DetailRow
          label="Email"
          value={email}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
        />
        <DetailRow
          label="Phone"
          value={contact?.phone}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
        <DetailRow
          label="Location"
          value={contact?.address}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
        <DetailRow label="Lead source" value={contact?.lead_source} />
      </Section>

      <Section title="Communication Preferences" open={prefsOpen} onToggle={() => setPrefsOpen((v) => !v)}>
        <DetailRow label="Preferred channel" value="—" />
        <DetailRow label="Marketing email" value="—" />
        <p className="text-[10px]" style={{ color: colors.textMuted }}>
          Preference tracking is not connected yet.
        </p>
      </Section>

      {contact && (
        <div className="px-4 pb-4 mt-auto">
          <button
            type="button"
            onClick={onCreateDeal}
            className="w-full text-xs font-semibold text-white py-2 rounded-full transition-opacity hover:opacity-90"
            style={{ background: colors.green }}
          >
            Create deal
          </button>
        </div>
      )}
    </aside>
  )
}
