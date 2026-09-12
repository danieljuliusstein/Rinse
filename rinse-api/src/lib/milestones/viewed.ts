import { scopedStorageKey } from '../tenant'
import type { Milestone } from './types'

export const MILESTONES_LAST_VIEWED_KEY = 'detailing_milestones_last_viewed'

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getMilestonesLastViewedAt(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(scopedStorageKey(MILESTONES_LAST_VIEWED_KEY))
}

export function markMilestonesViewed(at: Date = new Date()): void {
  if (!canUseStorage()) return
  localStorage.setItem(scopedStorageKey(MILESTONES_LAST_VIEWED_KEY), at.toISOString())
}

export function hasUnviewedMilestones(milestones: Milestone[]): boolean {
  const unlocked = milestones.filter((m) => m.status === 'unlocked' && m.unlockedAtIso)
  if (unlocked.length === 0) return false

  const lastViewed = getMilestonesLastViewedAt()
  if (!lastViewed) return true

  const viewedMs = new Date(lastViewed).getTime()
  if (Number.isNaN(viewedMs)) return true

  return unlocked.some((m) => {
    const unlockedMs = new Date(m.unlockedAtIso!).getTime()
    return !Number.isNaN(unlockedMs) && unlockedMs > viewedMs
  })
}
