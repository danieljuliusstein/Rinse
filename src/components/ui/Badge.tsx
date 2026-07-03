import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'yellow' | 'amber' | 'blue' | 'gray' | 'red' | 'draft'

const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'badge-status badge-status--green',
  yellow: 'badge-status badge-status--yellow',
  amber: 'badge-status badge-status--amber',
  blue: 'badge-status badge-status--blue',
  gray: 'badge-status badge-status--gray',
  red: 'badge-status badge-status--red',
  draft: 'badge-status badge-status--draft',
}

/** Maps invoice/job/quote status strings to a single badge tone. */
export function statusToBadgeTone(status: string): BadgeTone {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'green'
    case 'sent':
    case 'invoiced':
    case 'in_progress':
    case 'partial':
      return 'amber'
    case 'overdue':
      return 'red'
    case 'scheduled':
      return 'blue'
    case 'accepted':
      return 'green'
    case 'declined':
    case 'expired':
      return 'red'
    case 'draft':
      return 'draft'
    default:
      return 'gray'
  }
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

interface BadgeProps {
  tone?: BadgeTone
  /** When set, tone is derived automatically. */
  status?: string
  children?: ReactNode
  className?: string
}

export default function Badge({ tone, status, children, className = '' }: BadgeProps) {
  const resolvedTone = tone ?? (status ? statusToBadgeTone(status) : 'gray')
  const label = children ?? (status ? formatStatusLabel(status) : null)
  return (
    <span className={`${TONE_CLASS[resolvedTone]}${className ? ` ${className}` : ''}`}>
      {label}
    </span>
  )
}
