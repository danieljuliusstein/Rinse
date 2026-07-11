import { getSecureItem, setSecureItem } from './secure-storage'
import { requireOrganizationId } from './org'
import type { Milestone } from './milestones'

const KEY_PREFIX = 'rinse_milestones_last_viewed'

function storageKey(): string {
  return `${KEY_PREFIX}_${requireOrganizationId()}`
}

export async function getMilestonesLastViewedAt(): Promise<string | null> {
  try {
    return await getSecureItem(storageKey())
  } catch {
    return null
  }
}

export async function markMilestonesViewed(at = new Date()): Promise<void> {
  try {
    await setSecureItem(storageKey(), at.toISOString())
  } catch {
    // non-fatal
  }
}

export async function hasUnviewedMilestones(milestones: Milestone[]): Promise<boolean> {
  const unlocked = milestones.filter((m) => m.status === 'unlocked' && m.unlockedAtIso)
  if (unlocked.length === 0) return false

  const lastViewed = await getMilestonesLastViewedAt()
  if (!lastViewed) return true

  const viewedMs = new Date(lastViewed).getTime()
  if (Number.isNaN(viewedMs)) return true

  return unlocked.some((m) => {
    const unlockedMs = new Date(m.unlockedAtIso!).getTime()
    return !Number.isNaN(unlockedMs) && unlockedMs > viewedMs
  })
}
