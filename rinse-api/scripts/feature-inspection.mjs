#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
const env = {}
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
}

const APP = env.APP_URL || 'http://127.0.0.1:3000'
const PB = env.PB_URL || env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'
const FLY_PB = 'https://detailing-pb.fly.dev'
const SECRET = env.INTERNAL_API_SECRET
const EMAIL = env.PB_EMAIL || env.NEXT_PUBLIC_PB_EMAIL
const PASSWORD = env.PB_PASSWORD || env.NEXT_PUBLIC_PB_PASSWORD

const results = []
function ok(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function pbAuth(base = PB) {
  const res = await fetch(`${base}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed on ${base}`)
  return (await res.json()).token
}

console.log('\n=== FEATURE INSPECTION ===\n')

// UI routes (no PIN on portal)
for (const path of ['/quotes', '/quotes/new', '/reports']) {
  const res = await fetch(`${APP}${path}`)
  ok(`UI route ${path}`, res.status === 200, `HTTP ${res.status}`)
}

// Portal bypasses PIN
const portalInvalid = await fetch(`${APP}/portal/invalid-token-test`)
const portalHtml = await portalInvalid.text()
ok('Portal page loads without redirect', portalInvalid.status === 200 && !portalHtml.includes('Enter PIN'))

// Quote hook + PDF + portal flow
const token = await pbAuth()
const pkg = (await (await fetch(`${PB}/api/collections/packages/records?perPage=1`, { headers: { Authorization: token } })).json()).items[0]
const clientRes = await fetch(`${PB}/api/collections/clients/records`, {
  method: 'POST',
  headers: { Authorization: token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: `Inspect ${Date.now()}`, lead_source: 'google' }),
})
const client = await clientRes.json()

const quoteRes = await fetch(`${PB}/api/collections/quotes/records`, {
  method: 'POST',
  headers: { Authorization: token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: client.id,
    package_id: pkg.id,
    vehicle_type: 'sedan',
    location_type: 'mobile',
    date: '2026-06-10',
    subtotal: 175,
    status: 'sent',
    valid_until: '2026-07-10',
  }),
})
const quote = await quoteRes.json()
ok('Quote auto-number hook', quote.quote_number?.startsWith('QTE-'), quote.quote_number)

const settingsRec = (await (await fetch(`${PB}/api/collections/app_settings/records?perPage=1`, { headers: { Authorization: token } })).json()).items[0]
const settings = {
  business_name: settingsRec?.business_name ?? 'Business',
  business_phone: settingsRec?.business_phone ?? '',
  business_email: settingsRec?.business_email ?? '',
  invoice_terms_footer: settingsRec?.invoice_terms_footer ?? '',
}

const pdfRes = await fetch(`${APP}/api/pdf/quote`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quote: { ...quote, client, package: pkg, client_id: client.id, package_id: pkg.id },
    settings,
  }),
})
ok('Quote PDF API', pdfRes.ok && pdfRes.headers.get('content-type')?.includes('pdf'), `HTTP ${pdfRes.status}`)

const portalCreate = await fetch(`${APP}/api/portal/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-secret': SECRET },
  body: JSON.stringify({ clientId: client.id, quoteId: quote.id, scope: 'quote' }),
})
const portalData = portalCreate.ok ? await portalCreate.json() : null
ok('Portal token create', portalCreate.ok, `HTTP ${portalCreate.status}`)

if (portalData?.token) {
  const apiRes = await fetch(`${APP}/api/portal/${portalData.token}`)
  const apiPayload = apiRes.ok ? await apiRes.json() : null
  ok('Portal API payload', apiRes.ok && apiPayload?.client?.name === client.name)

  const pageRes = await fetch(`${APP}/portal/${portalData.token}`)
  const pageHtml = await pageRes.text()
  ok('Portal page renders client', pageRes.ok && pageHtml.includes(client.name))

  const acceptRes = await fetch(`${APP}/api/portal/${portalData.token}/accept-quote`, { method: 'POST' })
  ok('Portal accept quote', acceptRes.ok, `HTTP ${acceptRes.status}`)
}

// Lead source alignment
const clientForm = readFileSync(join(root, 'src/components/ClientForm.tsx'), 'utf8')
const schema = readFileSync(join(root, 'pocketbase/pb_schema.json'), 'utf8')
const formSources = clientForm.match(/LEAD_SOURCES = \[(.*?)\]/)?.[1] ?? ''
const schemaMatch = schema.match(/"name": "lead_source"[\s\S]*?"values": \[(.*?)\]/)
const schemaSources = schemaMatch?.[1]?.replace(/"/g, '').split(',').map((s) => s.trim()) ?? []
const formList = formSources.replace(/'/g, '').split(',').map((s) => s.trim())
ok('Lead sources aligned', formList.every((s) => schemaSources.includes(s)), formList.join(', '))

// Production Fly collections
try {
  const flyToken = await pbAuth(FLY_PB)
  for (const col of ['quotes', 'portal_tokens']) {
    const res = await fetch(`${FLY_PB}/api/collections/${col}/records?perPage=1`, { headers: { Authorization: flyToken } })
    ok(`Fly production ${col}`, res.status === 200, `HTTP ${res.status}`)
  }
} catch (e) {
  ok('Fly production check', false, e.message)
}

// Cleanup
await fetch(`${PB}/api/collections/quotes/records/${quote.id}`, { method: 'DELETE', headers: { Authorization: token } })
await fetch(`${PB}/api/collections/clients/records/${client.id}`, { method: 'DELETE', headers: { Authorization: token } })

console.log('\n=== SUMMARY ===\n')
const passed = results.filter((r) => r.pass).length
console.log(`${passed}/${results.length} checks passed`)
if (passed < results.length) process.exit(1)
