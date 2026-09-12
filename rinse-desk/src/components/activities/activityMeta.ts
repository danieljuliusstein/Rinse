import { Phone, Mail, StickyNote, CalendarDays } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityType } from '@/lib/types'

export type ActivityFilter = 'all' | ActivityType

export const TYPE_META: Record<
  ActivityType,
  {
    label: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
    chip: string
    dot: string
  }
> = {
  call: {
    label: 'Call',
    icon: Phone,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-600',
    chip: 'bg-brand-50 text-brand-700 ring-brand-200',
    dot: 'bg-brand-500',
  },
  email: {
    label: 'Email',
    icon: Mail,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    chip: 'bg-teal-50 text-teal-700 ring-teal-200',
    dot: 'bg-teal-400',
  },
  note: {
    label: 'Note',
    icon: StickyNote,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-400',
  },
  meeting: {
    label: 'Meeting',
    icon: CalendarDays,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    chip: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-400',
  },
}

export const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'call', label: 'Calls' },
  { key: 'email', label: 'Emails' },
  { key: 'note', label: 'Notes' },
  { key: 'meeting', label: 'Meetings' },
]

export const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'note', 'meeting']

const MIN = 60_000

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / MIN)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.round(d / 7)
  return `${w}w ago`
}

export function localTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Row shape for the timeline — DeskActivity + resolved labels */
export type ActivityRow = {
  id: string
  type: ActivityType
  contactId: string
  contactName: string
  dealId?: string
  dealLabel?: string
  subject: string
  body: string
  at: string
}
