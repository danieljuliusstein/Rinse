import type { DeskActivity, DeskClient } from '@/lib/types'
import { colors } from '@/theme/colors'
import { avatarTone, formatDatePill, formatMessageTime, initialsFromName } from './chatUtils'

type Props = {
  activity: DeskActivity
  contact: DeskClient | null
  onCall: () => void
  onEmail: () => void
  onTrash: () => void
  onSpam: () => void
  onOpenCalendar?: () => void
}

export function ActivityDetail({
  activity,
  contact,
  onCall,
  onEmail,
  onTrash,
  onSpam,
  onOpenCalendar,
}: Props) {
  const name = contact?.name ?? 'Contact'
  const tone = avatarTone(activity.contact_id || activity.id)
  const typeLabel =
    activity.type === 'call'
      ? 'Call'
      : activity.type === 'email'
        ? 'Email'
        : activity.type === 'meeting'
          ? 'Meeting'
          : 'Activity'

  return (
    <div className="flex flex-col h-full min-w-0" style={{ background: colors.bg }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-white"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {initialsFromName(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
          <p className="text-[10px] text-gray-400">
            {typeLabel} · {formatDatePill(activity.occurred_at)}
          </p>
        </div>
        {activity.type === 'call' && contact?.phone && (
          <button
            type="button"
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Call"
            onClick={onCall}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        )}
        {activity.type === 'email' && contact?.email && (
          <button
            type="button"
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Email"
            onClick={onEmail}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </button>
        )}
        {activity.type === 'meeting' && onOpenCalendar && (
          <button
            type="button"
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: colors.green }}
            onClick={onOpenCalendar}
          >
            Calendar
          </button>
        )}
        <button type="button" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Spam" onClick={onSpam}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </button>
        <button type="button" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Trash" onClick={onTrash}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-4"
          style={{ border: `1px solid ${colors.border}` }}
        >
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-800">{activity.subject}</span>
            <span className="text-[10px] text-gray-400">{formatMessageTime(activity.occurred_at)}</span>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
            {activity.body?.trim() || 'No notes logged for this activity.'}
          </p>
          {contact?.phone && activity.type === 'call' && (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex mt-4 text-xs font-semibold"
              style={{ color: colors.greenText }}
            >
              Dial {contact.phone}
            </a>
          )}
          {contact?.email && activity.type === 'email' && (
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent(activity.subject)}`}
              className="inline-flex mt-4 text-xs font-semibold"
              style={{ color: colors.greenText }}
            >
              Open mail client
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
