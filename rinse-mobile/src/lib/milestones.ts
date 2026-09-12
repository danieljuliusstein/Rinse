import { fmt } from '@rinse/core'
import type { Client, JobStatus, JobWithRelations, LeadWithRelations } from '@rinse/core'

export type MilestoneIcon = 'trophy' | 'medal' | 'briefcase' | 'dollar' | 'calendar'

export type MilestoneId = 'first_job' | 'jobs_10' | 'jobs_50' | 'rev_week' | 'first_book'

export interface Milestone {
  id: MilestoneId
  title: string
  requirement: string
  status: 'unlocked' | 'locked'
  unlockedAt?: string
  unlockedAtIso?: string
  progress?: string
  icon: MilestoneIcon
}

export interface MilestoneState {
  milestones: Milestone[]
  totalJobs: number
  totalEarned: number
  unlockedCount: number
}

export const MILESTONE_COUNT = 5

const COMPLETED_STATUSES: JobStatus[] = ['completed', 'invoiced', 'paid']

function isCompletedStatus(status: JobStatus): boolean {
  return COMPLETED_STATUSES.includes(status)
}

function normalizeDateOnly(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  const slice = value.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slice)) return null
  const d = new Date(`${slice}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return slice
}

function formatUnlockDate(isoDate: string): string | undefined {
  const normalized = normalizeDateOnly(isoDate)
  if (!normalized) return undefined
  return new Date(`${normalized}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function weekStartKey(dateStr: string): string | null {
  const normalized = normalizeDateOnly(dateStr)
  if (!normalized) return null
  const d = new Date(`${normalized}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const key = d.toISOString().split('T')[0]
  return normalizeDateOnly(key)
}

function completedJobsSorted(jobs: JobWithRelations[]): JobWithRelations[] {
  return jobs
    .filter((j) => isCompletedStatus(j.status) && normalizeDateOnly(j.date))
    .sort((a, b) => {
      const byDate = (normalizeDateOnly(a.date) ?? '').localeCompare(normalizeDateOnly(b.date) ?? '')
      if (byDate !== 0) return byDate
      return (a.created ?? a.id).localeCompare(b.created ?? b.id)
    })
}

function bestWeekEarned(jobs: JobWithRelations[]): number {
  const byWeek = new Map<string, number>()
  for (const job of jobs) {
    const key = weekStartKey(job.date)
    if (!key) continue
    const earned = job.revenue + job.tip
    byWeek.set(key, (byWeek.get(key) ?? 0) + earned)
  }
  let max = 0
  for (const total of byWeek.values()) {
    if (total > max) max = total
  }
  return max
}

function weekEarnedAtOrAbove(jobs: JobWithRelations[], threshold: number): string | null {
  const byWeek = new Map<string, number>()
  for (const job of jobs) {
    const key = weekStartKey(job.date)
    if (!key) continue
    const earned = job.revenue + job.tip
    byWeek.set(key, (byWeek.get(key) ?? 0) + earned)
  }
  const qualifying = [...byWeek.entries()]
    .filter(([, total]) => total >= threshold)
    .sort(([a], [b]) => a.localeCompare(b))
  return qualifying[0]?.[0] ?? null
}

function isBookingLinkJob(job: JobWithRelations, leads: LeadWithRelations[]): boolean {
  const notes = job.notes?.toLowerCase() ?? ''
  if (notes.includes('web booking')) return true
  if (job.client?.lead_source === 'website') return true
  return leads.some(
    (lead) =>
      lead.source === 'website' &&
      (lead.job_id === job.id || (lead.client_id != null && lead.client_id === job.client_id))
  )
}

function firstBookingUnlock(jobs: JobWithRelations[], leads: LeadWithRelations[]): string | null {
  const bookingJobs = jobs
    .filter((j) => isBookingLinkJob(j, leads) && normalizeDateOnly(j.date))
    .sort((a, b) => {
      const byDate = (normalizeDateOnly(a.date) ?? '').localeCompare(normalizeDateOnly(b.date) ?? '')
      if (byDate !== 0) return byDate
      return (a.created ?? a.id).localeCompare(b.created ?? b.id)
    })
  return normalizeDateOnly(bookingJobs[0]?.date)
}

function milestoneAtIndex(completed: JobWithRelations[], index: number): string | null {
  return normalizeDateOnly(completed[index]?.date)
}

interface MilestoneDef {
  id: MilestoneId
  title: string
  requirement: string
  icon: MilestoneIcon
  resolve: (ctx: {
    completed: JobWithRelations[]
    completedCount: number
    jobs: JobWithRelations[]
    leads: LeadWithRelations[]
    bestWeek: number
  }) => { unlocked: boolean; unlockedAtIso?: string; progress?: string }
}

const DEFINITIONS: MilestoneDef[] = [
  {
    id: 'first_job',
    title: 'First finish',
    requirement: 'Complete 1 job',
    icon: 'trophy',
    resolve: ({ completed, completedCount }) => ({
      unlocked: completedCount >= 1,
      unlockedAtIso: milestoneAtIndex(completed, 0) ?? undefined,
    }),
  },
  {
    id: 'jobs_10',
    title: 'Getting rolling',
    requirement: '10 jobs complete',
    icon: 'medal',
    resolve: ({ completed, completedCount }) => ({
      unlocked: completedCount >= 10,
      unlockedAtIso: milestoneAtIndex(completed, 9) ?? undefined,
    }),
  },
  {
    id: 'jobs_50',
    title: 'Established',
    requirement: '50 jobs complete',
    icon: 'briefcase',
    resolve: ({ completed, completedCount }) => ({
      unlocked: completedCount >= 50,
      unlockedAtIso: milestoneAtIndex(completed, 49) ?? undefined,
      progress: completedCount >= 50 ? undefined : `${completedCount} of 50 jobs`,
    }),
  },
  {
    id: 'rev_week',
    title: 'Strong week',
    requirement: '$1,000+ in one week',
    icon: 'dollar',
    resolve: ({ jobs, bestWeek }) => {
      const unlockWeek = weekEarnedAtOrAbove(jobs, 1000)
      return {
        unlocked: unlockWeek != null,
        unlockedAtIso: unlockWeek ?? undefined,
        progress: unlockWeek ? undefined : `Best week: ${fmt(bestWeek)}`,
      }
    },
  },
  {
    id: 'first_book',
    title: 'Booked online',
    requirement: 'First booking-link job',
    icon: 'calendar',
    resolve: ({ jobs, leads }) => {
      const unlockDate = firstBookingUnlock(jobs, leads)
      return {
        unlocked: unlockDate != null,
        unlockedAtIso: unlockDate ?? undefined,
      }
    },
  },
]

export function computeMilestoneState(
  jobs: JobWithRelations[],
  leads: LeadWithRelations[] = [],
  _clients: Client[] = []
): MilestoneState {
  const completed = completedJobsSorted(jobs)
  const completedCount = completed.length
  const totalEarned = completed.reduce((sum, j) => sum + j.revenue + j.tip, 0)
  const bestWeek = bestWeekEarned(jobs)
  const ctx = { completed, completedCount, jobs, leads, bestWeek }

  const milestones: Milestone[] = DEFINITIONS.map((def) => {
    const result = def.resolve(ctx)
    const unlocked = result.unlocked
    return {
      id: def.id,
      title: def.title,
      requirement: def.requirement,
      icon: def.icon,
      status: unlocked ? 'unlocked' : 'locked',
      unlockedAt: unlocked && result.unlockedAtIso ? formatUnlockDate(result.unlockedAtIso) : undefined,
      unlockedAtIso: unlocked ? result.unlockedAtIso : undefined,
      progress: unlocked ? undefined : result.progress,
    }
  })

  return {
    milestones,
    totalJobs: completedCount,
    totalEarned,
    unlockedCount: milestones.filter((m) => m.status === 'unlocked').length,
  }
}

export function formatLifetimeEarned(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return fmt(n)
}
