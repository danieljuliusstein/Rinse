#!/usr/bin/env node
/**
 * Seed a test client + unpaid invoice + portal link for Stripe checkout testing.
 * Usage: node scripts/seed-stripe-test.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim()
  }
}

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

async function pbAuth() {
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { token: data.token, organizationId: data.record?.organization_id }
}

async function pbGet(token, path) {
  const res = await fetch(`${PB_URL}${path}`, { headers: { Authorization: token } })
  return { ok: res.ok, data: res.ok ? await res.json() : null }
}

async function pbPost(token, collection, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = res.ok ? await res.json() : await res.text()
  return { ok: res.ok, data }
}

async function pbPatch(token, collection, id, body) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = res.ok ? await res.json() : await res.text()
  return { ok: res.ok, data }
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function main() {
  if (!PB_URL || !EMAIL || !PASSWORD) {
    console.error('Missing PB_URL / PB_EMAIL / PB_PASSWORD in .env.local')
    process.exit(1)
  }
  if (!INTERNAL_SECRET) {
    console.error('Missing INTERNAL_API_SECRET in .env.local')
    process.exit(1)
  }

  console.log('Seeding Stripe test data...\n')
  const { token, organizationId } = await pbAuth()
  if (!organizationId) {
    console.error('User has no organization_id')
    process.exit(1)
  }
  const today = new Date().toISOString().slice(0, 10)

  const pkgs = await pbGet(token, '/api/collections/packages/records?perPage=1&filter=active=true')
  const packageId = pkgs.data?.items?.[0]?.id
  const packageName = pkgs.data?.items?.[0]?.name ?? 'Full Detail'
  if (!packageId) {
    console.error('No active packages found. Run: npm run seed:packages')
    process.exit(1)
  }

  const clientRes = await pbPost(token, 'clients', {
    organization_id: organizationId,
    name: 'Stripe Test Client',
    phone: '(555) 867-5309',
    email: 'stripe.test@example.com',
    lead_source: 'google',
    notes: 'Test data for Stripe portal checkout',
  })
  if (!clientRes.ok) {
    console.error('Failed to create client:', clientRes.data)
    process.exit(1)
  }
  const clientId = clientRes.data.id

  const jobRes = await pbPost(token, 'jobs', {
    organization_id: organizationId,
    date: today,
    start_time: '10:00',
    client_id: clientId,
    package_id: packageId,
    vehicle_type: 'sedan',
    location_type: 'mobile',
    status: 'completed',
    revenue: 150,
    tip: 15,
    travel_cost: 0,
  })
  if (!jobRes.ok) {
    console.error('Failed to create job:', jobRes.data)
    process.exit(1)
  }
  const jobId = jobRes.data.id

  const invNum = `INV-STRIPE-${Date.now().toString().slice(-6)}`
  const total = 165
  const invRes = await pbPost(token, 'invoices', {
    organization_id: organizationId,
    invoice_number: invNum,
    job_id: jobId,
    client_id: clientId,
    subtotal: 150,
    tip: 15,
    total,
    status: 'sent',
    sent_at: today,
    balance_due: total,
    amount_paid: 0,
    payments: [],
  })
  if (!invRes.ok) {
    console.error('Failed to create invoice:', invRes.data)
    process.exit(1)
  }
  const invoiceId = invRes.data.id

  await pbPatch(token, 'jobs', jobId, { invoice_id: invoiceId, status: 'invoiced' })

  // Tomorrow's job — for SMS reminder cron testing
  const reminderJob = await pbPost(token, 'jobs', {
    organization_id: organizationId,
    date: tomorrow(),
    start_time: '09:00',
    client_id: clientId,
    package_id: packageId,
    vehicle_type: 'suv',
    location_type: 'mobile',
    status: 'scheduled',
    revenue: 150,
    tip: 0,
    travel_cost: 0,
  })

  const portalRes = await fetch(`${APP_URL}/api/portal/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': INTERNAL_SECRET },
    body: JSON.stringify({ clientId, jobId, scope: 'invoice' }),
  })
  const portalData = portalRes.ok ? await portalRes.json() : null
  if (!portalRes.ok) {
    console.error('Failed to create portal token. Is npm run dev running?', await portalRes.text())
    process.exit(1)
  }

  const portalUrl = portalData.url || `${APP_URL}/portal/${portalData.token}`

  console.log('✓ Test data created\n')
  console.log('Client:     Stripe Test Client')
  console.log('Invoice:   ', invNum, `— $${total.toFixed(2)} balance due`)
  console.log('Job:       ', jobId)
  console.log('')
  console.log('── Stripe test (open this in browser) ──')
  console.log(portalUrl)
  console.log('')
  console.log('Click "Pay online" → test card 4242 4242 4242 4242')
  console.log('')
  console.log('── In the operator app ──')
  console.log(`Jobs:    ${APP_URL}/jobs/${jobId}`)
  console.log(`Pipeline: ${APP_URL}/pipeline  (website lead)`)
  if (reminderJob.ok) {
    console.log(`Reminder job scheduled for tomorrow (${tomorrow()}) — SMS cron test`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
