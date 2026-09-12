import type { ReactNode } from 'react'
import type { InboxLabel } from '@/lib/inbox-labels'
import { colors } from '@/theme/colors'
import type { InboxFolderId } from './inboxFolders'

type Counts = Partial<Record<string, number>>

type Props = {
  active: InboxFolderId
  counts: Counts
  labels: InboxLabel[]
  userInitials: string
  othersOpen: boolean
  teamsOpen: boolean
  onToggleOthers: () => void
  onToggleTeams: () => void
  onSelect: (id: InboxFolderId) => void
}

/** Folders where the count badge should draw attention (chat / unread). */
const EMPHASIS_COUNT_FOLDERS = new Set<string>(['chat'])

function Row({
  id,
  label,
  icon,
  count,
  active,
  onSelect,
}: {
  id: InboxFolderId
  label: string
  icon: ReactNode
  count?: number
  active: boolean
  onSelect: (id: InboxFolderId) => void
}) {
  const emphasizeCount = EMPHASIS_COUNT_FOLDERS.has(id)
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors border-l-[3px] ${
        active ? 'font-semibold rounded-r-lg' : 'rounded-lg border-l-transparent'
      }`}
      style={
        active
          ? {
              background: colors.greenSoft,
              color: colors.greenHover,
              borderLeftColor: colors.green,
            }
          : { color: colors.textSecondary }
      }
    >
      <span
        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        style={{ color: active ? colors.greenHover : colors.textMuted }}
      >
        {icon}
      </span>
      <span className="truncate flex-1 text-left">{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          className="text-[11px] font-medium tabular-nums rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
          style={
            emphasizeCount || (active && id === 'chat')
              ? { background: colors.green, color: '#fff' }
              : { background: colors.bg, color: colors.textMuted }
          }
        >
          {count}
        </span>
      )}
    </button>
  )
}

function PathIcon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} />
    </svg>
  )
}

export function InboxFolderNav({
  active,
  counts,
  labels,
  userInitials,
  othersOpen,
  teamsOpen,
  onToggleOthers,
  onToggleTeams,
  onSelect,
}: Props) {
  return (
    <aside
      className="h-full border-r bg-white overflow-auto py-2 px-1.5 min-w-0"
      style={{ borderColor: colors.border }}
    >
      <div className="space-y-0.5 mb-2">
        <Row
          id="assigned"
          label="Assigned to me"
          count={counts.assigned}
          active={active === 'assigned'}
          onSelect={onSelect}
          icon={
            <span
              className="w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center"
              style={{ background: colors.sidebarFrom, color: '#fff' }}
            >
              {userInitials.slice(0, 2)}
            </span>
          }
        />
        <Row
          id="unassigned"
          label="Unassigned"
          count={counts.unassigned}
          active={active === 'unassigned'}
          onSelect={onSelect}
          icon={<PathIcon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />}
        />
        <Row
          id="all_open"
          label="All open"
          count={counts.all_open}
          active={active === 'all_open'}
          onSelect={onSelect}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          }
        />
      </div>

      <div className="my-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />

      <div className="space-y-0.5 mb-2">
        <Row
          id="email"
          label="Email"
          count={counts.email}
          active={active === 'email'}
          onSelect={onSelect}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
        />
        <Row
          id="chat"
          label="Chat"
          count={counts.chat}
          active={active === 'chat'}
          onSelect={onSelect}
          icon={<PathIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
        />
        <Row
          id="calls"
          label="Calls"
          count={counts.calls}
          active={active === 'calls'}
          onSelect={onSelect}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
        <Row
          id="sent"
          label="Sent"
          count={counts.sent}
          active={active === 'sent'}
          onSelect={onSelect}
          icon={<PathIcon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />}
        />
        <Row
          id="all_closed"
          label="All Closed"
          count={counts.all_closed}
          active={active === 'all_closed'}
          onSelect={onSelect}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <line x1="9" y1="10" x2="15" y2="16" />
              <line x1="15" y1="10" x2="9" y2="16" />
            </svg>
          }
        />
      </div>

      <div className="my-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />

      <button
        type="button"
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-80"
        style={{ color: colors.textMuted }}
        onClick={onToggleOthers}
      >
        Others
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={othersOpen ? '' : 'rotate-180'}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {othersOpen && (
        <div className="space-y-0.5 mb-2">
          <Row
            id="schedule"
            label="Schedule"
            count={counts.schedule}
            active={active === 'schedule'}
            onSelect={onSelect}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <Row
            id="draft"
            label="Draft"
            count={counts.draft}
            active={active === 'draft'}
            onSelect={onSelect}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            }
          />
          <Row
            id="spam"
            label="Spam"
            count={counts.spam}
            active={active === 'spam'}
            onSelect={onSelect}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
          />
          <Row
            id="trash"
            label="Trash"
            count={counts.trash}
            active={active === 'trash'}
            onSelect={onSelect}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            }
          />
        </div>
      )}

      <div className="my-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />

      <button
        type="button"
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-80"
        style={{ color: colors.textMuted }}
        onClick={onToggleTeams}
      >
        Team inboxes
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={teamsOpen ? '' : 'rotate-180'}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {teamsOpen && (
        <div className="space-y-0.5">
          {labels.map((l) => {
            const id = `label:${l.id}` as InboxFolderId
            return (
              <Row
                key={l.id}
                id={id}
                label={l.name}
                count={counts[id]}
                active={active === id}
                onSelect={onSelect}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                }
              />
            )
          })}
          <Row
            id="manage_labels"
            label="Manage Labels"
            active={active === 'manage_labels'}
            onSelect={onSelect}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
          />
        </div>
      )}
    </aside>
  )
}
