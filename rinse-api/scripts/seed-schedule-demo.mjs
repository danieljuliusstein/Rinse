#!/usr/bin/env node
/**
 * Seed schedule, travel, time-off, and directions demo data into PocketBase.
 * Usage: npm run seed:schedule-demo
 * Idempotent — updates settings/packages/clients and skips existing time blocks by label+date.
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PB_PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const ORG_SLUG = (process.env.ORG_SLUG ?? 'atlas-detailing').trim()

const DEMO_SCHEDULE = {
  work_days: [1, 2, 3, 4, 5, 6],
  start_time: '08:00',
  end_time: '18:00',
  lunch_start: '12:00',
  lunch_end: '13:00',
  slot_interval_minutes: 120,
}

const TRAVEL_RATE_PER_MILE = 0.67

const PACKAGE_DURATIONS = {
  'basic wash': 90,
  'full detail': 240,
  'paint correction': 300,
  'paint correct': 300,
  'ceramic coat': 360,
}

const CLIENT_ADDRESSES = [
  { match: /marcus/i, address: '1420 Peachtree St NE, Atlanta, GA 30309' },
  { match: /sarah/i, address: '245 N Highland Ave NE, Atlanta, GA 30307' },
  { match: /james/i, address: '88 Keys Ferry Rd, McDonough, GA 30253' },
]

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function nextSunday(fromIso) {
  const d = new Date(fromIso + 'T12:00:00')
  const day = d.getDay()
  const delta = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function auth() {
  if (!PB_EMAIL || !PB_PASSWORD) {
    console.error('Set PB_EMAIL and PB_PASSWORD (or NEXT_PUBLIC_PB_* in .env.local)')
    process.exit(1)
  }
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  })
  if (!res.ok) {
    console.error('Auth failed:', await res.text())
    process.exit(1)
  }
  const { token } = await res.json()
  return { Authorization: token, 'Content-Type': 'application/json' }
}

async function listRecords(headers, collection, filter = '') {
  const params = new URLSearchParams({ perPage: '200' })
  if (filter) params.set('filter', filter)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, { headers })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 404 && text.includes('Missing collection')) {
      return null
    }
    throw new Error(`${collection} list failed: ${text}`)
  }
  const data = await res.json()
  return data.items ?? []
}

async function patchRecord(headers, collection, id, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${collection} patch failed: ${await res.text()}`)
  return res.json()
}

async function createRecord(headers, collection, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${collection} create failed: ${await res.text()}`)
  return res.json()
}

function addressForClient(name) {
  return CLIENT_ADDRESSES.find((c) => c.match.test(name))?.address
}

async function resolveOrgId(headers) {
  const filter = `slug = "${escapeFilter(ORG_SLUG)}"`
  const orgs = await listRecords(headers, 'organizations', filter)
  const orgId = orgs[0]?.id
  if (!orgId) {
    console.error(`Organization not found for slug: ${ORG_SLUG}`)
    process.exit(1)
  }
  return orgId
}

async function seedSettings(headers, orgId) {
  const rows = await listRecords(
    headers,
    'app_settings',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  if (!rows.length) {
    console.warn('No app_settings row — create one in the app first')
    return
  }
  const row = rows[0]
  await patchRecord(headers, 'app_settings', row.id, {
    booking_schedule: DEMO_SCHEDULE,
    travel_rate_per_mile: TRAVEL_RATE_PER_MILE,
    business_phone: row.business_phone || '(404) 555-0142',
    business_address: row.business_address || '1200 West Peachtree St NW, Atlanta, GA 30309',
  })
  console.log('Updated app_settings: schedule, travel rate $0.67/mi')
}

async function seedPackages(headers, orgId) {
  const packages = await listRecords(
    headers,
    'packages',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  let updated = 0
  for (const pkg of packages) {
    const name = String(pkg.name ?? '').toLowerCase()
    const minutes = PACKAGE_DURATIONS[name]
    if (!minutes || pkg.duration_minutes === minutes) continue
    await patchRecord(headers, 'packages', pkg.id, { duration_minutes: minutes })
    console.log(`  + duration ${minutes}m: ${pkg.name}`)
    updated++
  }
  if (updated === 0) console.log('Package durations already set')
}

async function seedClientAddresses(headers, orgId) {
  const clients = await listRecords(
    headers,
    'clients',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  let updated = 0
  for (const client of clients) {
    const address = addressForClient(String(client.name ?? ''))
    if (!address || client.address === address) continue
    await patchRecord(headers, 'clients', client.id, { address })
    console.log(`  + address: ${client.name}`)
    updated++
  }
  if (updated === 0) console.log('Client addresses already set')
}

async function seedTimeBlocks(headers, orgId) {
  const today = isoToday()
  const templates = [
    { date: nextSunday(today), all_day: true, label: 'Day off' },
    { date: addDays(today, 4), all_day: false, start_time: '14:00', end_time: '17:00', label: 'Dentist' },
  ]

  const existing = await listRecords(
    headers,
    'time_blocks',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  if (existing === null) {
    console.warn('time_blocks collection missing — run: cd pocketbase && ./pocketbase migrate up')
    return
  }
  const keys = new Set(existing.map((b) => `${b.date}:${b.label}`))

  let created = 0
  for (const block of templates) {
    const key = `${block.date}:${block.label}`
    if (keys.has(key)) {
      console.log(`Skip time block: ${block.label} on ${block.date}`)
      continue
    }
    await createRecord(headers, 'time_blocks', {
      organization_id: orgId,
      date: block.date,
      all_day: block.all_day,
      start_time: block.all_day ? '' : block.start_time,
      end_time: block.all_day ? '' : block.end_time,
      label: block.label,
    })
    console.log(`  + time off: ${block.label} (${block.date})`)
    created++
  }
  if (created === 0) console.log('Time blocks already seeded')
}

async function seedBookingDemoJob(headers, orgId) {
  const today = isoToday()
  const jobs = await listRecords(
    headers,
    'jobs',
    `organization_id = "${escapeFilter(orgId)}" && date = "${today}" && start_time = "10:00"`,
  )
  if (jobs.length > 0) {
    console.log('Booking demo job already exists for today 10:00')
    return
  }

  const packages = await listRecords(
    headers,
    'packages',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  const fullDetail =
    packages.find((p) => /full detail/i.test(String(p.name ?? ''))) ?? packages[0]
  if (!fullDetail) {
    console.warn('No packages — run npm run seed:packages first')
    return
  }

  const clients = await listRecords(
    headers,
    'clients',
    `organization_id = "${escapeFilter(orgId)}"`,
  )
  const client =
    clients.find((c) => /sarah/i.test(String(c.name ?? ''))) ?? clients[0]
  if (!client) {
    console.warn('No clients — add a client first')
    return
  }

  await createRecord(headers, 'jobs', {
    organization_id: orgId,
    date: today,
    start_time: '10:00',
    location_type: 'mobile',
    package_id: fullDetail.id,
    vehicle_type: 'suv',
    client_id: client.id,
    status: 'scheduled',
    revenue: fullDetail.base_price ?? 320,
    tip: 0,
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
    hours_worked: 0,
    notes: 'Demo — blocks 10:00 and 12:00 slots for Full Detail (4h)',
  })
  console.log(`Created booking demo job: today 10:00 · ${fullDetail.name}`)
}

async function main() {
  const headers = await auth()
  const orgId = await resolveOrgId(headers)
  console.log(`Seeding schedule demo for ${ORG_SLUG} (${orgId})`)

  await seedSettings(headers, orgId)
  await seedPackages(headers, orgId)
  await seedClientAddresses(headers, orgId)
  await seedTimeBlocks(headers, orgId)
  await seedBookingDemoJob(headers, orgId)

  console.log('\nDone. Try:')
  console.log('  · Settings → Schedule & time off')
  console.log('  · Home → Directions on today\'s job')
  console.log('  · Jobs → New → Expenses → enter miles (auto travel $)')
  console.log(`  · /book/${ORG_SLUG} — Sunday closed, lunch blocked, 10:00 taken`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
