export type MilestoneIcon = 'trophy' | 'medal' | 'briefcase' | 'dollar' | 'calendar'

export type MilestoneId =
  | 'first_job'
  | 'jobs_10'
  | 'jobs_50'
  | 'rev_week'
  | 'first_book'

export interface Milestone {
  id: MilestoneId
  title: string
  requirement: string
  status: 'unlocked' | 'locked'
  /** Display date, e.g. "Mar 12, 2026" */
  unlockedAt?: string
  /** ISO timestamp for comparing against last-viewed */
  unlockedAtIso?: string
  /** Human-readable progress when locked */
  progress?: string
  icon: MilestoneIcon
}

export interface MilestoneState {
  milestones: Milestone[]
  totalJobs: number
  totalEarned: number
  unlockedCount: number
}
