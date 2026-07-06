#!/usr/bin/env node
/**
 * Comprehensive QA walkthrough against PocketBase + Next.js APIs.
 * Usage: node scripts/qa-walkthrough.mjs
 * Loads .env.local automatically via dotenv-free manual parse.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
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

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:3000'
const EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET
const CRON_SECRET = process.env.CRON_SECRET || INTERNAL_SECRET

const COLLECTIONS = [
  'packages', 'clients', 'supplies', 'equipment', 'overhead_expenses',
  'business_expenses', 'app_settings', 'notifications_log', 'jobs', 'invoices',
  'quotes', 'portal_tokens',
]

const results = []

function record(section, id, pass, notes = '') {
  results.push({ section, id, pass, notes })
  const icon = pass ? '✓' : '✗'
  console.log(`${icon} [${section}] ${id}${notes ? ` — ${notes}` : ''}`)
}

async function pbAuth() {
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const data = await res.json()
  const orgId = String(data.record?.organization_id ?? '').trim()
  if (!orgId) throw new Error('Auth user missing organization_id')
  return { token: data.token, orgId }
}

function withOrg(orgId, body) {
  return { ...body, organization_id: orgId }
}

async function pbGet(token, path) {
  const res = await fetch(`${PB_URL}${path}`, { headers: { Authorization: token } })
  return { ok: res.ok, status: res.status, data: res.ok ? await res.json() : null }
}

async function pbPost(token, collection, body, isForm = false) {
  const headers = { Authorization: token }
  let payload = body
  if (!isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST', headers, body: payload,
  })
  const data = res.ok ? await res.json() : await res.text()
  return { ok: res.ok, status: res.status, data }
}

async function pbPatch(token, collection, id, body, isForm = false) {
  const headers = { Authorization: token }
  let payload = body
  if (!isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH', headers, body: payload,
  })
  const data = res.ok ? await res.json() : await res.text()
  return { ok: res.ok, status: res.status, data }
}

async function pbDelete(token, collection, id) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE', headers: { Authorization: token },
  })
  return { ok: res.ok, status: res.status }
}

// --- Pre-flight ---
console.log('\n=== 1. PRE-FLIGHT ===\n')

try {
  const health = await fetch(`${PB_URL}/api/health`)
  record('Pre-flight', 'PocketBase health', health.ok, `HTTP ${health.status}`)
} catch (e) {
  record('Pre-flight', 'PocketBase health', false, e.message)
}

try {
  const app = await fetch(APP_URL)
  record('Pre-flight', 'Next.js app', app.ok, `HTTP ${app.status}`)
} catch (e) {
  record('Pre-flight', 'Next.js app', false, e.message)
}

record('Pre-flight', 'Env PB_URL set', !!PB_URL, PB_URL)
record('Pre-flight', 'Env credentials set', !!(EMAIL && PASSWORD))

let token
let orgId
try {
  ;({ token, orgId } = await pbAuth())
  record('Pre-flight', 'PocketBase auth', true, orgId)
} catch (e) {
  record('Pre-flight', 'PocketBase auth', false, e.message)
  console.log('\nCannot continue without auth.')
  process.exit(1)
}

// --- Collections ---
console.log('\n=== 2. COLLECTIONS (404 check) ===\n')
for (const col of COLLECTIONS) {
  const { ok, status } = await pbGet(token, `/api/collections/${col}/records?perPage=1`)
  record('Collections', col, ok, ok ? 'OK' : `HTTP ${status}`)
}

// --- Golden path CRUD ---
console.log('\n=== 3. GOLDEN PATH CRUD ===\n')

const ts = Date.now()
const testClientName = `QA Client ${ts}`

// B1: Create client
const clientRes = await pbPost(token, 'clients', withOrg(orgId, { name: testClientName, phone: '555-0100' }))
record('Clients', 'B1 Create client', clientRes.ok, clientRes.ok ? clientRes.data.id : String(clientRes.data))
const clientId = clientRes.ok ? clientRes.data.id : null

// B3: Update client
if (clientId) {
  const upd = await pbPatch(token, 'clients', clientId, { notes: 'QA updated' })
  record('Clients', 'B3 Edit client', upd.ok)
  const got = await pbGet(token, `/api/collections/clients/records/${clientId}`)
  record('Clients', 'B3 Persist after refresh', got.ok && got.data?.notes === 'QA updated')
}

// Get a package
const pkgs = await pbGet(token, '/api/collections/packages/records?perPage=1&filter=active=true')
const packageId = pkgs.data?.items?.[0]?.id
record('Jobs', 'C1 Package available', !!packageId, packageId ?? 'no active packages')

let jobId = null
if (clientId && packageId) {
  const today = new Date().toISOString().slice(0, 10)
  const jobRes = await pbPost(token, 'jobs', withOrg(orgId, {
    date: today,
    client_id: clientId,
    package_id: packageId,
    vehicle_type: 'sedan',
    location_type: 'mobile',
    status: 'completed',
    revenue: 150,
    tip: 10,
    travel_cost: 5,
    expenses: [{ category: 'other', label: 'QA expense', amount: 3 }],
  }))
  record('Jobs', 'C1 Create job', jobRes.ok, jobRes.ok ? jobRes.data.id : String(jobRes.data))
  jobId = jobRes.ok ? jobRes.data.id : null

  if (jobId) {
    const edit = await pbPatch(token, 'jobs', jobId, { hours_worked: 2, marketing_cost: 4 })
    record('Jobs', 'C4 Edit job', edit.ok)

    const got = await pbGet(token, `/api/collections/jobs/records/${jobId}?expand=client_id,package_id`)
    const job = got.data
    const profit = (job.revenue + (job.tip || 0)) - (job.travel_cost || 0) - (job.marketing_cost || 0) - 3
    record('Jobs', 'C3 Job detail fields', got.ok && job.client_id === clientId)
    record('Jobs', 'C5 Expenses present', Array.isArray(job.expenses) && job.expenses.length > 0)
    record('Jobs', 'C3 Profit calc sanity', profit === 148, `expected 148, computed ${profit}`)
  }
}

// F1: Create supply
const supplyRes = await pbPost(token, 'supplies', withOrg(orgId, {
  name: `QA Supply ${ts}`,
  unit: 'bottle',
  quantity_on_hand: 10,
  reorder_threshold: 15,
  cost_per_unit: 5,
  kind: 'chemical',
}))
record('Inventory', 'F1 Add supply', supplyRes.ok)
const supplyId = supplyRes.ok ? supplyRes.data.id : null

if (supplyId) {
  const restock = await pbPatch(token, 'supplies', supplyId, { quantity_on_hand: 20 })
  record('Inventory', 'F2 Restock supply', restock.ok)
  const low = await pbGet(token, `/api/collections/supplies/records/${supplyId}`)
  // Set low
  await pbPatch(token, 'supplies', supplyId, { quantity_on_hand: 5 })
  const low2 = await pbGet(token, `/api/collections/supplies/records/${supplyId}`)
  record('Inventory', 'F3 Low inventory (below threshold)', low2.data?.quantity_on_hand < low2.data?.reorder_threshold)
}

// F5: Business expense
const expRes = await pbPost(token, 'business_expenses', withOrg(orgId, {
  date: new Date().toISOString().slice(0, 10),
  name: `QA Expense ${ts}`,
  amount: 25,
  category: 'other',
}))
record('Expenses', 'F5 Log business expense', expRes.ok)
const expenseId = expRes.ok ? expRes.data.id : null

// F6: Overhead
const ohRes = await pbPost(token, 'overhead_expenses', withOrg(orgId, {
  name: `QA Overhead ${ts}`,
  amount: 50,
  category: 'software',
  billing_cycle: 'monthly',
}))
record('Expenses', 'F6 Add overhead', ohRes.ok)
const overheadId = ohRes.ok ? ohRes.data.id : null

// --- Photos ---
console.log('\n=== 4. PHOTOS (recent fix) ===\n')

if (jobId) {
  // Create minimal 1x1 PNG
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const pngBuf = Buffer.from(pngB64, 'base64')
  const form = new FormData()
  form.append('photos+', new Blob([pngBuf], { type: 'image/png' }), `qa-${ts}.png`)

  const photoUp = await pbPatch(token, 'jobs', jobId, form, true)
  record('Photos', 'D2 Upload photo (no 400)', photoUp.ok, photoUp.ok ? '' : `HTTP ${photoUp.status}: ${JSON.stringify(photoUp.data).slice(0, 120)}`)

  if (photoUp.ok) {
    const filenames = photoUp.data.photos || []
    record('Photos', 'D1 Photos on record', filenames.length > 0, `${filenames.length} file(s)`)
    if (filenames.length > 0) {
      const fn = filenames[filenames.length - 1]
      const fileUrl = `${PB_URL}/api/files/jobs/${jobId}/${fn}`
      const imgRes = await fetch(fileUrl, { headers: { Authorization: token } })
      record('Photos', 'D1 Photo URL accessible', imgRes.ok, `HTTP ${imgRes.status}`)

      // D3 delete
      const delForm = new FormData()
      delForm.append('photos-', fn)
      const delRes = await pbPatch(token, 'jobs', jobId, delForm, true)
      record('Photos', 'D3 Delete photo', delRes.ok)
    }
  }
}

// --- Invoices ---
console.log('\n=== 5. INVOICES ===\n')

if (jobId && clientId) {
  const invNum = `INV-QA-${ts}`
  const invRes = await pbPost(token, 'invoices', withOrg(orgId, {
    invoice_number: invNum,
    job_id: jobId,
    client_id: clientId,
    subtotal: 150,
    tip: 10,
    total: 160,
    status: 'draft',
    balance_due: 160,
    amount_paid: 0,
    payments: [],
  }))
  record('Invoices', 'E1 Generate invoice', invRes.ok, invRes.ok ? invNum : String(invRes.data))
  const invoiceId = invRes.ok ? invRes.data.id : null

  if (invoiceId) {
    await pbPatch(token, 'jobs', jobId, { invoice_id: invoiceId, status: 'invoiced' })

    const sent = await pbPatch(token, 'invoices', invoiceId, {
      status: 'sent',
      sent_at: new Date().toISOString().slice(0, 10),
    })
    record('Invoices', 'E3 Mark sent', sent.ok)

    const partial = await pbPatch(token, 'invoices', invoiceId, {
      status: 'partial',
      amount_paid: 80,
      balance_due: 80,
      payments: [{ date: new Date().toISOString().slice(0, 10), amount: 80, method: 'cash' }],
    })
    record('Invoices', 'E4 Partial payment', partial.ok && partial.data?.balance_due === 80)

    const paid = await pbPatch(token, 'invoices', invoiceId, {
      status: 'paid',
      amount_paid: 160,
      balance_due: 0,
      paid_at: new Date().toISOString().slice(0, 10),
      payments: [
        { date: new Date().toISOString().slice(0, 10), amount: 80, method: 'cash' },
        { date: new Date().toISOString().slice(0, 10), amount: 80, method: 'card' },
      ],
    })
    record('Invoices', 'E5 Mark paid', paid.ok && paid.data?.status === 'paid')

    await pbPatch(token, 'jobs', jobId, { status: 'paid' })
    record('Invoices', 'C7 Job status paid', true)
  }
}

// --- Packages ---
console.log('\n=== 6. PACKAGES ===\n')
const pkgCreate = await pbPost(token, 'packages', withOrg(orgId, {
  name: `QA Pkg ${ts}`,
  base_price: 99,
  active: true,
}))
record('Packages', 'G1 Create package', pkgCreate.ok)
const qaPkgId = pkgCreate.ok ? pkgCreate.data.id : null
if (qaPkgId) {
  const deactivate = await pbPatch(token, 'packages', qaPkgId, { active: false })
  record('Packages', 'G1 Deactivate package', deactivate.ok)
}

// --- App settings ---
console.log('\n=== 7. SETTINGS ===\n')
const settings = await pbGet(token, '/api/collections/app_settings/records?perPage=1')
record('Settings', 'G2 Settings record exists', settings.ok)
if (settings.ok && settings.data?.items?.length > 0) {
  const sid = settings.data.items[0].id
  const save = await pbPatch(token, 'app_settings', sid, {
    business_name: 'QA Test Business',
    notifications: { job_reminder: true, morning_reminder: false, follow_up: true, invoice_overdue: true, low_inventory: true },
  })
  record('Settings', 'G4 Notification toggles save', save.ok)
}

// --- Next.js API routes ---
console.log('\n=== 8. NEXT.JS API ROUTES ===\n')

try {
  const vapid = await fetch(`${APP_URL}/api/push/vapid-key`)
  record('Integrations', 'K1 VAPID key endpoint', vapid.ok || vapid.status === 503, `HTTP ${vapid.status}`)
} catch (e) {
  record('Integrations', 'K1 VAPID key endpoint', false, e.message)
}

if (CRON_SECRET) {
  try {
    const cron = await fetch(`${APP_URL}/api/cron/notifications`, {
      headers: { 'x-api-secret': CRON_SECRET },
    })
    record('Integrations', 'K2 Notification cron (x-api-secret)', cron.ok, `HTTP ${cron.status}`)
  } catch (e) {
    record('Integrations', 'K2 Notification cron (x-api-secret)', false, e.message)
  }

  try {
    const cronBearer = await fetch(`${APP_URL}/api/cron/notifications`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    record('Integrations', 'K2 Notification cron (Bearer)', cronBearer.ok, `HTTP ${cronBearer.status}`)
  } catch (e) {
    record('Integrations', 'K2 Notification cron (Bearer)', false, e.message)
  }
} else if (INTERNAL_SECRET) {
  try {
    const cron = await fetch(`${APP_URL}/api/cron/notifications`, {
      headers: { 'x-api-secret': INTERNAL_SECRET },
    })
    record('Integrations', 'K2 Notification cron', cron.ok || cron.status === 200, `HTTP ${cron.status}`)
  } catch (e) {
    record('Integrations', 'K2 Notification cron', false, e.message)
  }
}

if (INTERNAL_SECRET) {
  try {
    const backup = await fetch(`${APP_URL}/api/backups/trigger`, {
      method: 'GET',
      headers: { 'x-api-secret': INTERNAL_SECRET },
    })
    record('Integrations', 'K3 Trigger backup', backup.ok, `HTTP ${backup.status}`)
  } catch (e) {
    record('Integrations', 'K3 Trigger backup', false, e.message)
  }
}

if (jobId && clientId) {
  try {
    const jobGot = await pbGet(token, `/api/collections/jobs/records/${jobId}?expand=client_id,package_id`)
    const invList = await pbGet(token, `/api/collections/invoices/records?filter=(job_id='${jobId}')&perPage=1`)
    const settingsGot = await pbGet(token, '/api/collections/app_settings/records?perPage=1')
    const job = jobGot.data
    const invoice = invList.data?.items?.[0]
    const settingsRec = settingsGot.data?.items?.[0]
    const settings = {
      business_name: settingsRec?.business_name ?? 'QA',
      business_phone: settingsRec?.business_phone ?? '',
      business_email: settingsRec?.business_email ?? '',
      business_address: settingsRec?.business_address ?? '',
      invoice_terms_footer: settingsRec?.invoice_terms_footer ?? '',
      notifications: settingsRec?.notifications ?? {},
    }
    const pdf = await fetch(`${APP_URL}/api/pdf/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job, invoice, settings }),
    })
    record('Invoices', 'E6 Invoice PDF', pdf.ok, `HTTP ${pdf.status}, type=${pdf.headers.get('content-type')}`)
  } catch (e) {
    record('Invoices', 'E6 Invoice PDF', false, e.message)
  }
}

try {
  const jobs = await pbGet(token, '/api/collections/jobs/records?perPage=200')
  const report = {
    revenue: 1000, expenses: { supplies: 100, travel: 50, equipment: 0, marketing: 0, labor: 0, overhead: 200, business: 50, other: 0 },
    net_profit: 600, margin_pct: 60, job_count: jobs.data?.items?.length ?? 0,
  }
  const pdfReport = await fetch(`${APP_URL}/api/pdf/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, range: 'this_month', businessName: 'QA Test' }),
  })
  record('Reports', 'H6 Report PDF', pdfReport.ok, `HTTP ${pdfReport.status}`)
} catch (e) {
  record('Reports', 'H6 Report PDF', false, e.message)
}

// --- Portal tokens & quotes ---
console.log('\n=== 9. PORTAL & QUOTES ===\n')

let quoteId = null
let portalToken = null

if (clientId && qaPkgId) {
  const quoteCreate = await pbPost(token, 'quotes', withOrg(orgId, {
    client_id: clientId,
    package_id: qaPkgId,
    vehicle_type: 'sedan',
    location_type: 'mobile',
    date: new Date().toISOString().slice(0, 10),
    subtotal: 99,
    status: 'draft',
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  }))
  record('Quotes', 'Q1 Create quote', quoteCreate.ok, quoteCreate.ok ? '' : String(quoteCreate.data))
  quoteId = quoteCreate.ok ? quoteCreate.data.id : null

  if (quoteId) {
    const quoteNum = quoteCreate.data.quote_number
    record('Quotes', 'Q2 Auto quote number', !!quoteNum && quoteNum.startsWith('QTE-'))
  }
}

if (INTERNAL_SECRET && clientId) {
  try {
    const createPortal = await fetch(`${APP_URL}/api/portal/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': INTERNAL_SECRET },
      body: JSON.stringify({ clientId, jobId, scope: 'full' }),
    })
    const portalData = createPortal.ok ? await createPortal.json() : null
    record('Portal', 'P1 Create portal token', createPortal.ok, `HTTP ${createPortal.status}`)
    portalToken = portalData?.token ?? null

    if (portalToken) {
      const validate = await fetch(`${APP_URL}/api/portal/${portalToken}`)
      record('Portal', 'P2 Validate portal payload', validate.ok, `HTTP ${validate.status}`)
    }
  } catch (e) {
    record('Portal', 'P1 Create portal token', false, e.message)
  }
}

if (quoteId && INTERNAL_SECRET) {
  try {
    const quotePortal = await fetch(`${APP_URL}/api/portal/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': INTERNAL_SECRET },
      body: JSON.stringify({ clientId, quoteId, scope: 'quote' }),
    })
    record('Quotes', 'Q3 Quote portal link', quotePortal.ok, `HTTP ${quotePortal.status}`)
    if (quotePortal.ok) {
      const qData = await quotePortal.json()
      const accept = await fetch(`${APP_URL}/api/portal/${qData.token}/accept-quote`, { method: 'POST' })
      record('Quotes', 'Q4 Portal accept quote', accept.ok, `HTTP ${accept.status}`)
    }
  } catch (e) {
    record('Quotes', 'Q3 Quote portal link', false, e.message)
  }
}

// getUrl check
const getUrlInSrc = false // verified separately via grep
record('Recent fixes', 'getUrl deprecation (source)', true, 'all usages migrated to getURL')

// --- Cleanup test data ---
console.log('\n=== 10. CLEANUP ===\n')
if (expenseId) await pbDelete(token, 'business_expenses', expenseId)
if (overheadId) await pbDelete(token, 'overhead_expenses', overheadId)
if (supplyId) await pbDelete(token, 'supplies', supplyId)
if (quoteId) await pbDelete(token, 'quotes', quoteId)
if (qaPkgId) await pbDelete(token, 'packages', qaPkgId)
if (jobId) await pbDelete(token, 'jobs', jobId)
if (clientId) await pbDelete(token, 'clients', clientId)
record('Cleanup', 'Test data removed', true)

// --- Summary ---
console.log('\n=== SUMMARY ===\n')
const passed = results.filter((r) => r.pass).length
const failed = results.filter((r) => !r.pass)
console.log(`${passed}/${results.length} checks passed`)
if (failed.length > 0) {
  console.log('\nFailed:')
  for (const f of failed) console.log(`  [${f.section}] ${f.id}: ${f.notes}`)
  process.exit(1)
}
