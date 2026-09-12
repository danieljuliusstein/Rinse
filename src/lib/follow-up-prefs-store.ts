import type { ClientWithStats } from '@rinse/core'
import {
  DEFAULT_FOLLOW_UP_PREFS,
  dismissUntilNextJobInPrefs,
  normalizeFollowUpPrefs,
  snoozeClientInPrefs,
  type FollowUpPrefs,
} from './follow-up-prefs'
import { getOrganizationId } from './org'
import { getSecureItem, setSecureItem } from './secure-storage'

export type { FollowUpPrefs, FollowUpSuppression } from './follow-up-prefs'
export {
  DEFAULT_FOLLOW_UP_PREFS,
  SNOOZE_DAYS,
  dismissUntilNextJobInPrefs,
  isFollowUpSuppressed,
  normalizeFollowUpPrefs,
  pruneFollowUpPrefs,
  snoozeClientInPrefs,
} from './follow-up-prefs'

function storageKey(orgId: string | null): string {
  return orgId ? `rinse_follow_up_prefs_${orgId}` : 'rinse_follow_up_prefs'
}

export async function loadFollowUpPrefs(): Promise<FollowUpPrefs> {
  const raw = await getSecureItem(storageKey(getOrganizationId()))
  if (!raw) return { ...DEFAULT_FOLLOW_UP_PREFS, suppressions: {} }
  try {
    return normalizeFollowUpPrefs(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_FOLLOW_UP_PREFS, suppressions: {} }
  }
}

export async function saveFollowUpPrefs(prefs: FollowUpPrefs): Promise<void> {
  await setSecureItem(storageKey(getOrganizationId()), JSON.stringify(prefs))
}

export async function snoozeClient(clientId: string, days: number): Promise<FollowUpPrefs> {
  const prefs = await loadFollowUpPrefs()
  const next = snoozeClientInPrefs(prefs, clientId, days)
  await saveFollowUpPrefs(next)
  return next
}

export async function dismissUntilNextJob(
  client: Pick<ClientWithStats, 'id' | 'lastJobDate'>,
): Promise<FollowUpPrefs> {
  const prefs = await loadFollowUpPrefs()
  const next = dismissUntilNextJobInPrefs(prefs, client)
  await saveFollowUpPrefs(next)
  return next
}

export async function setShowFollowUpSection(show: boolean): Promise<FollowUpPrefs> {
  const prefs = await loadFollowUpPrefs()
  const next = { ...prefs, showFollowUpSection: show }
  await saveFollowUpPrefs(next)
  return next
}
