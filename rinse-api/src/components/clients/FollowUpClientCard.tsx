'use client'

import { useRouter } from 'next/navigation'
import { Clock } from '@phosphor-icons/react'
import { timeAgo } from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

function followUpMeta(client: ClientWithStats): string {
  if (client.lastJobDate) {
    return `Last job ${timeAgo(client.lastJobDate)}`
  }
  return 'No jobs yet'
}

function followUpAction(client: ClientWithStats): { label: string; href: string } {
  if (client.lastJobDate && derivedDaysSince(client) >= 42) {
    return { label: 'Rebook', href: `/jobs/new?client=${client.id}` }
  }
  return { label: 'Chase', href: `/clients/${client.id}` }
}

function derivedDaysSince(client: ClientWithStats): number {
  if (!client.lastJobDate) return 999
  const d = new Date(client.lastJobDate.slice(0, 10) + 'T12:00:00')
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

interface FollowUpClientCardProps {
  client: ClientWithStats
}

export default function FollowUpClientCard({ client }: FollowUpClientCardProps) {
  const router = useRouter()
  const action = followUpAction(client)

  return (
    <div className="followup-card followup-card--action">
      <Clock className="followup-icon" size={20} weight="duotone" aria-hidden="true" />
      <div className="followup-body">
        <div className="followup-name">{client.name}</div>
        <div className="followup-meta">{followUpMeta(client)}</div>
      </div>
      <button
        type="button"
        className="followup-action"
        onClick={() => router.push(action.href)}
      >
        {action.label}
      </button>
    </div>
  )
}
