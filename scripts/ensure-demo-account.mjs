#!/usr/bin/env node
/**
 * Create (or verify) a dedicated demo operator account + org for marketing captures.
 * Uses PB admin — does not seed data (run npm run seed:demo after).
 *
 * Usage: node scripts/ensure-demo-account.mjs
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

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

const DEMO_EMAIL = (process.env.DEMO_ACCOUNT_EMAIL ?? 'demo@rinsehq.com').trim().toLowerCase()
const DEMO_PASSWORD = (process.env.DEMO_ACCOUNT_PASSWORD ?? 'SummitDemo2026!').trim()
const DEMO_SLUG = (process.env.DEMO_ORG_SLUG ?? 'summit-detail').trim()
const DEMO_BUSINESS = (process.env.DEMO_BUSINESS_NAME ?? 'Summit Mobile Detail').trim()

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function adminAuth() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env.local')
    process.exit(1)
  }
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) {
    console.error('Admin auth failed:', await res.text())
    process.exit(1)
  }
  const data = await res.json()
  return { Authorization: data.token, 'Content-Type': 'application/json' }
}

async function list(headers, collection, filter = '') {
  const params = new URLSearchParams({ perPage: '200' })
  if (filter) params.set('filter', filter)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, { headers })
  if (!res.ok) throw new Error(`${collection} list: ${await res.text()}`)
  return (await res.json()).items ?? []
}

async function create(headers, collection, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${collection} create: ${await res.text()}`)
  return res.json()
}

async function patch(headers, collection, id, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${collection} patch: ${await res.text()}`)
  return res.json()
}

async function main() {
  const headers = await adminAuth()
  console.log(`Demo account target: ${DEMO_EMAIL} → org slug "${DEMO_SLUG}"\n`)

  let org = (await list(headers, 'organizations', `slug = "${escapeFilter(DEMO_SLUG)}"`))[0]
  if (!org) {
    org = await create(headers, 'organizations', {
      name: DEMO_BUSINESS,
      slug: DEMO_SLUG,
      plan: 'founding',
      founding_member: true,
      booking_enabled: true,
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    })
    console.log(`Created organization: ${org.id} (${DEMO_SLUG})`)
  } else {
    console.log(`Organization exists: ${org.id} (${DEMO_SLUG})`)
  }

  const orgId = org.id
  let user = (await list(headers, 'users', `email = "${escapeFilter(DEMO_EMAIL)}"`))[0]
  if (!user) {
    user = await create(headers, 'users', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
      organization_id: orgId,
      verified: true,
    })
    console.log(`Created user: ${DEMO_EMAIL}`)
  } else {
    await patch(headers, 'users', user.id, {
      organization_id: orgId,
      verified: true,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
    })
    console.log(`Updated user: ${DEMO_EMAIL} (password reset to demo default)`)
  }

  const settings = await list(headers, 'app_settings', `organization_id = "${escapeFilter(orgId)}"`)
  if (!settings.length) {
    await create(headers, 'app_settings', {
      organization_id: orgId,
      business_name: DEMO_BUSINESS,
      business_email: DEMO_EMAIL,
      invoice_terms_footer: 'Thank you for your business! Payment due upon receipt.',
      booking_schedule: {
        work_days: [1, 2, 3, 4, 5, 6],
        start_time: '08:00',
        end_time: '18:00',
        lunch_start: '12:00',
        lunch_end: '13:00',
        slot_interval_minutes: 120,
      },
      notifications: {
        job_reminder: true,
        morning_reminder: true,
        follow_up: true,
        invoice_overdue: true,
        low_inventory: true,
      },
    })
    console.log('Created app_settings row')
  }

  console.log('\n── Demo login (rinsehq.com/auth) ──')
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
  console.log(`  Booking:  /book/${DEMO_SLUG}`)
  console.log('\nNext: FORCE_DEMO_PHOTOS=1 ORG_SLUG=' + DEMO_SLUG + ' npm run seed:demo')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
