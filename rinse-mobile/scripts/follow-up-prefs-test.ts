/**
 * Follow-up prefs unit checks (local dismiss / snooze).
 *
 * Run from rinse-mobile/:
 *   npx tsx scripts/follow-up-prefs-test.ts
 */
import {
  DEFAULT_FOLLOW_UP_PREFS,
  dismissUntilNextJobInPrefs,
  isFollowUpSuppressed,
  normalizeFollowUpPrefs,
  pruneFollowUpPrefs,
  snoozeClientInPrefs,
  type FollowUpPrefs,
} from '../src/lib/follow-up-prefs'

let passed = 0
let failed = 0

function assert(cond: boolean, message: string) {
  if (cond) {
    passed += 1
    console.log(`  ok  ${message}`)
  } else {
    failed += 1
    console.error(`  FAIL  ${message}`)
  }
}

const client = { id: 'c1', lastJobDate: '2026-01-15' }
const now = new Date('2026-09-11T12:00:00.000Z')

console.log('isFollowUpSuppressed')
assert(!isFollowUpSuppressed(client, DEFAULT_FOLLOW_UP_PREFS, now), 'no suppression → visible')

const snoozed = snoozeClientInPrefs(DEFAULT_FOLLOW_UP_PREFS, client.id, 7, now)
assert(isFollowUpSuppressed(client, snoozed, now), 'active snooze → hidden')
assert(
  !isFollowUpSuppressed(client, snoozed, new Date('2026-09-19T12:00:00.000Z')),
  'expired snooze → visible',
)

const dismissed = dismissUntilNextJobInPrefs(DEFAULT_FOLLOW_UP_PREFS, client)
assert(isFollowUpSuppressed(client, dismissed, now), 'dismiss until next job → hidden')
assert(
  !isFollowUpSuppressed({ id: 'c1', lastJobDate: '2026-09-01' }, dismissed, now),
  'new job clears dismiss',
)
assert(
  isFollowUpSuppressed({ id: 'c1', lastJobDate: undefined }, dismissUntilNextJobInPrefs(DEFAULT_FOLLOW_UP_PREFS, { id: 'c1', lastJobDate: undefined }), now),
  'dismiss with no last job stays hidden',
)

console.log('pruneFollowUpPrefs')
const prefsWithStale: FollowUpPrefs = {
  showFollowUpSection: true,
  suppressions: {
    c1: { until: '2026-01-01T00:00:00.000Z' },
    c2: { untilNextJobAfter: '2026-01-01' },
    c3: { until: '2026-12-01T00:00:00.000Z' },
  },
}
const pruned = pruneFollowUpPrefs(
  prefsWithStale,
  [
    { id: 'c2', lastJobDate: '2026-02-01' },
    { id: 'c3', lastJobDate: '2026-01-01' },
  ],
  now,
)
assert(pruned.suppressions.c1 == null, 'prunes expired snooze')
assert(pruned.suppressions.c2 == null, 'prunes dismiss after new job')
assert(pruned.suppressions.c3?.until === '2026-12-01T00:00:00.000Z', 'keeps active snooze')

console.log('normalizeFollowUpPrefs')
assert(normalizeFollowUpPrefs(null).showFollowUpSection === true, 'default show section true')
assert(normalizeFollowUpPrefs({ showFollowUpSection: false }).showFollowUpSection === false, 'respects false')
assert(
  normalizeFollowUpPrefs({
    showFollowUpSection: true,
    suppressions: { x: { until: '2026-10-01T00:00:00.000Z', junk: 1 } },
  }).suppressions.x?.until === '2026-10-01T00:00:00.000Z',
  'keeps valid until',
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
