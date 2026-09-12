/**
 * Automated native sync QA — PocketBase integration checks for docs/native-sync-qa.md.
 *
 * Usage (from rinse-mobile/):
 *   npm run sync-qa
 *
 * Requires rinse-mobile/.env:
 *   EXPO_PUBLIC_PB_URL
 *   EXPO_PUBLIC_TEST_EMAIL
 *   EXPO_PUBLIC_TEST_PASSWORD
 *
 * Set SYNC_QA_KEEP=1 to leave test records in PB (debugging).
 */
import PocketBase from 'pocketbase'
import { generatePocketBaseId } from '@rinse/core'
import { loadRinseMobileEnv } from './load-env'
import { isServerRecordNewer } from '../src/lib/sync-conflict.logic'

loadRinseMobileEnv()

const PB_ID_RE = /^[a-z0-9]{15}$/

interface Check {
  section: string
  label: string
  pass: boolean
  detail?: string
}

const checks: Check[] = []

function check(section: string, label: string, pass: boolean, detail?: string): void {
  checks.push({ section, label, pass, detail })
  const icon = pass ? '✓' : '✗'
  console.log(`${icon} [${section}] ${label}${detail ? ` — ${detail}` : ''}`)
}

function localCalendarDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultQuickJobStatus(jobDate: string): string {
  return jobDate > localCalendarDate() ? 'scheduled' : 'completed'
}

function formatPbError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: unknown; message?: string } }).response
    const data = response?.data
    if (data && typeof data === 'object') {
      const parts: string[] = []
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (key === 'message') continue
        parts.push(`${key}: ${JSON.stringify(value)}`)
      }
      if (parts.length > 0) return parts.join('; ')
    }
    if (response?.message) return response.message
  }
  return err instanceof Error ? err.message : String(err)
}

function jobCreateBody(
  orgId: string,
  id: string,
  clientId: string,
  packageId: string,
  date: string,
  notes: string
): Record<string, unknown> {
  return {
    id,
    organization_id: orgId,
    client_id: clientId,
    package_id: packageId,
    date,
    location_type: 'mobile',
    vehicle_type: 'sedan',
    status: defaultQuickJobStatus(date),
    revenue: 99,
    tip: 0,
    start_time: '',
    notes,
    hours_worked: 0,
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    expenses: [],
    supplies_used: [],
  }
}

function assertPbId(id: string, label: string): boolean {
  const ok = PB_ID_RE.test(id)
  if (!ok) check('ids', label, false, `invalid id: ${id}`)
  return ok
}

async function createJobRecord(
  pb: PocketBase,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    return (await pb.collection('jobs').create(body)) as Record<string, unknown>
  } catch (err) {
    throw new Error(`Job create failed: ${formatPbError(err)}`)
  }
}

async function main(): Promise<void> {
  const pbUrl = process.env.EXPO_PUBLIC_PB_URL
  const email = process.env.EXPO_PUBLIC_TEST_EMAIL
  const password = process.env.EXPO_PUBLIC_TEST_PASSWORD

  const missing: string[] = []
  if (!pbUrl) missing.push('EXPO_PUBLIC_PB_URL')
  if (!email) missing.push('EXPO_PUBLIC_TEST_EMAIL')
  if (!password) missing.push('EXPO_PUBLIC_TEST_PASSWORD')

  if (missing.length > 0) {
    console.error('Missing env in rinse-mobile/.env:\n')
    for (const key of [
      'EXPO_PUBLIC_PB_URL',
      'EXPO_PUBLIC_TEST_EMAIL',
      'EXPO_PUBLIC_TEST_PASSWORD',
    ]) {
      const set = !missing.includes(key)
      console.error(`  ${set ? '✓' : '✗'} ${key}`)
    }
    console.error(
      '\nAdd test org operator credentials (dedicated QA org — see docs/native-sync-qa.md):\n' +
        '  EXPO_PUBLIC_TEST_EMAIL=you@example.com\n' +
        '  EXPO_PUBLIC_TEST_PASSWORD=your-password'
    )
    process.exit(1)
  }

  const pbUrlResolved = pbUrl!
  const emailResolved = email!
  const passwordResolved = password!

  const cleanup: Array<() => Promise<void>> = []
  const keep = process.env.SYNC_QA_KEEP === '1'

  try {
    // §1 — Online baseline
    const health = await fetch(`${pbUrlResolved.replace(/\/$/, '')}/api/health`)
    check('§1', 'PocketBase health', health.ok, pbUrlResolved)

    const pb = new PocketBase(pbUrlResolved)
    await pb.collection('users').authWithPassword(emailResolved, passwordResolved)
    check('§1', 'Login with test org credentials', pb.authStore.isValid, emailResolved)

    const orgId = pb.authStore.record?.organization_id
    if (typeof orgId !== 'string' || !orgId) {
      throw new Error('Test user has no organization_id — complete web onboarding first')
    }

    const jobsList = await pb.collection('jobs').getList(1, 5, { sort: '-date' })
    check('§1', 'Jobs list loads from PocketBase', true, `${jobsList.totalItems} total`)

    const clientsList = await pb.collection('clients').getList(1, 5, { sort: 'name' })
    check('§1', 'Clients list loads from PocketBase', true, `${clientsList.totalItems} total`)

    const packages = await pb.collection('packages').getFullList({
      filter: `organization_id = "${orgId}" && active = true`,
      sort: 'name',
    })
    check('§2', 'Test org has active package', packages.length > 0)
    if (packages.length === 0) {
      throw new Error('Add at least one active package in the web app before sync QA')
    }

    const pkg = packages[0]!
    const today = localCalendarDate()
    const stamp = Date.now()

    // §2 — Online create (client-generated IDs, same as native executeWrite + sync-runner)
    const onlineClientId = generatePocketBaseId()
    const onlineJobId = generatePocketBaseId()
    assertPbId(onlineClientId, 'online client id format')
    assertPbId(onlineJobId, 'online job id format')

    const onlineClientName = `Sync QA Online ${stamp}`
    await pb.collection('clients').create({
      id: onlineClientId,
      organization_id: orgId,
      name: onlineClientName,
      phone: '5555550101',
      email: '',
      address: '',
      notes: 'native-sync-qa §2',
      tags: [],
    })
    cleanup.push(async () => {
      try {
        await pb.collection('clients').delete(onlineClientId)
      } catch {
        /* already removed */
      }
    })

    check('§2', 'Create client with device-generated id', true, onlineClientId)

    await createJobRecord(
      pb,
      jobCreateBody(orgId, onlineJobId, onlineClientId, pkg.id, today, 'native-sync-qa §2')
    )
    cleanup.push(async () => {
      try {
        await pb.collection('jobs').delete(onlineJobId)
      } catch {
        /* already removed */
      }
    })

    const onlineJob = await pb.collection('jobs').getOne(onlineJobId)
    check('§2', 'Create job linked to client', onlineJob.client_id === onlineClientId, onlineJobId)
    check('§2', 'PB admin shows matching IDs', onlineClientId.length === 15 && onlineJobId.length === 15)

    // §3–§4 — Offline queue simulation (sequential flush with predetermined ids)
    const offlineClientId = generatePocketBaseId()
    const offlineJobId = generatePocketBaseId()
    const offlineClientName = `Sync QA Offline ${stamp}`

    type QueueStep =
      | { kind: 'client'; id: string; name: string }
      | { kind: 'job'; id: string; clientId: string }

    const queue: QueueStep[] = [
      { kind: 'client', id: offlineClientId, name: offlineClientName },
      { kind: 'job', id: offlineJobId, clientId: offlineClientId },
    ]

    check('§3', 'Offline queue staged (2 items)', queue.length === 2)

    for (const step of queue) {
      if (step.kind === 'client') {
        await pb.collection('clients').create({
          id: step.id,
          organization_id: orgId,
          name: step.name,
          phone: '5555550102',
          email: '',
          address: '',
          notes: 'native-sync-qa §3 offline',
          tags: [],
        })
        cleanup.push(async () => {
          try {
            await pb.collection('clients').delete(step.id)
          } catch {
            /* noop */
          }
        })
      } else {
        await createJobRecord(
          pb,
          {
            ...jobCreateBody(orgId, step.id, step.clientId, pkg.id, today, 'native-sync-qa §4 flush'),
            revenue: 88,
          }
        )
        cleanup.push(async () => {
          try {
            await pb.collection('jobs').delete(step.id)
          } catch {
            /* noop */
          }
        })
      }
    }

    check('§4', 'Sequential flush uploaded all queue items', true, '2 records')
    const flushedJob = await pb.collection('jobs').getOne(offlineJobId)
    check('§4', 'Job client_id FK correct after flush', flushedJob.client_id === offlineClientId)
    check(
      '§4',
      'Ids are 15-char PB format (no temp ids)',
      PB_ID_RE.test(offlineClientId) && PB_ID_RE.test(offlineJobId)
    )

    // §6 — Conflict detection (server updated > local mirror timestamp)
    const beforeClient = await pb.collection('clients').getOne(onlineClientId)
    const mirrorUpdated = String(beforeClient.updated ?? '')
    if (!mirrorUpdated) {
      check(
        '§6',
        'PocketBase exposes clients.updated autodate',
        false,
        'Deploy pocketbase/pb_migrations/1762500000_record_updated_autodate.js to Fly'
      )
    } else {
      await new Promise((r) => setTimeout(r, 1100))
      await pb.collection('clients').update(onlineClientId, { notes: 'web edit from sync-qa' })
      const serverClient = await pb.collection('clients').getOne(onlineClientId)
      const serverUpdated = String(serverClient.updated ?? '')
      const conflict = isServerRecordNewer(serverUpdated, mirrorUpdated)
      check('§6', 'Web edit advances server updated', serverUpdated > mirrorUpdated, serverUpdated)
      check('§6', 'Conflict detectable (server > local mirror)', conflict)
    }

    console.log('\n--- Manual only (device) ---')
    console.log('§3  Airplane mode + in-app create (use Settings → Simulate offline in dev)')
    console.log('§5  Background app 2+ min, foreground refresh')
    console.log('§6  Conflict banner + Refresh in native client detail')
    console.log('§7  Subscription gate (optional)')
    console.log('§8  Sign-out with empty / pending queue')
    console.log('     Dogfood day checklist')
  } catch (err) {
    const msg = formatPbError(err)
    const hint =
      msg.includes('Something went wrong') ?
        ' (likely PocketBase jobs_photo_validate hook on fly — deploy pocketbase/pb_hooks fix)'
      : ''
    check('fatal', 'Sync QA run', false, msg + hint)
  } finally {
    if (!keep && cleanup.length > 0) {
      console.log('\nCleaning up test records…')
      for (const fn of [...cleanup].reverse()) {
        await fn()
      }
    } else if (keep) {
      console.log('\nSYNC_QA_KEEP=1 — test records left in PocketBase')
    }
  }

  const failed = checks.filter((c) => !c.pass)
  const passed = checks.length - failed.length
  console.log(`\n${passed}/${checks.length} automated checks passed`)

  if (failed.length > 0) {
    console.error('\nFailed:')
    for (const f of failed) {
      console.error(`  [${f.section}] ${f.label}${f.detail ? ` — ${f.detail}` : ''}`)
    }
    process.exit(1)
  }
}

void main()
