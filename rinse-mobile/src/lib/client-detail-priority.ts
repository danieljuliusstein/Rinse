import type { Client, JobWithRelations } from '@rinse/core'
import { fmt } from '@rinse/core'
import { formatJobDate } from '@/src/lib/format-dates'
import { timeAgo } from '@/src/lib/client-relationship-logic'

export type ClientDetailSection =
  | 'vehicles'
  | 'upcoming'
  | 'history'
  | 'quotes'
  | 'membership'
  | 'notes'
  | 'family'

export type ClientStatusTone = 'green' | 'blue' | 'amber' | 'red' | 'gray'

export interface ClientDetailPriority {
  eyebrow: string
  heading: string
  statusTone: ClientStatusTone
  defaultSection: ClientDetailSection | null
  isVip: boolean
  initials: string
}

const VIP_REVENUE = 500

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function clientDetailPriority(
  client: Client,
  jobs: JobWithRelations[],
  vehicleCount: number,
): ClientDetailPriority {
  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)
  const isVip = totalRevenue >= VIP_REVENUE
  const initials = deriveInitials(client.name)
  const upcoming = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress')
  const activeJobs = jobs.filter((j) => j.status !== 'cancelled')

  if (client.membership_paused) {
    return {
      eyebrow: 'MEMBERSHIP',
      heading: 'Paused — resume when ready to book',
      statusTone: 'amber',
      defaultSection: 'membership',
      isVip,
      initials,
    }
  }

  if (upcoming.length > 0) {
    const next = upcoming[0]!
    const when = formatJobDate(next.date)
    const service = next.package?.name ?? 'Job'
    return {
      eyebrow: 'UPCOMING',
      heading: `${service} · ${when}`,
      statusTone: 'blue',
      defaultSection: 'upcoming',
      isVip,
      initials,
    }
  }

  if (activeJobs.length === 0) {
    return {
      eyebrow: 'NEW CLIENT',
      heading: 'Book the first visit to get started',
      statusTone: 'gray',
      defaultSection: vehicleCount > 0 ? 'vehicles' : null,
      isVip,
      initials,
    }
  }

  const lastJob = [...activeJobs].sort((a, b) => b.date.localeCompare(a.date))[0]
  const daysSince = lastJob
    ? Math.floor(
        (Date.now() - new Date(`${lastJob.date}T12:00:00`).getTime()) / 86_400_000,
      )
    : 0

  if (daysSince > 60 && !isVip) {
    return {
      eyebrow: 'FOLLOW UP',
      heading: `Last visit ${timeAgo(lastJob!.date)} — check in`,
      statusTone: 'amber',
      defaultSection: 'history',
      isVip,
      initials,
    }
  }

  if (isVip) {
    return {
      eyebrow: 'VIP CLIENT',
      heading: `${fmt(totalRevenue)} lifetime · ${activeJobs.length} jobs`,
      statusTone: 'green',
      defaultSection: vehicleCount > 0 ? 'vehicles' : 'history',
      isVip,
      initials,
    }
  }

  return {
    eyebrow: 'CLIENT',
    heading: `${activeJobs.length} job${activeJobs.length === 1 ? '' : 's'} · ${fmt(totalRevenue)} revenue`,
    statusTone: 'green',
    defaultSection: vehicleCount > 0 ? 'vehicles' : 'history',
    isVip,
    initials,
  }
}
