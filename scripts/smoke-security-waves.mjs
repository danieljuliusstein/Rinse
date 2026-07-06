#!/usr/bin/env node
/**
 * Smoke test Security Waves 5–7 against a running Next.js server.
 * Usage: node scripts/smoke-security-waves.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:3000
 *
 * For CSP/HSTS headers, start with production mode:
 *   NODE_ENV=production npm run start
 */

const base = (process.argv[2] || process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const isProd = process.env.NODE_ENV === 'production'

const results = []

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`✓ ${name}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({ name, ok: false, error: msg })
    console.log(`✗ ${name}: ${msg}`)
  }
}

async function fetchHeaders(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' })
  return { res, headers: res.headers }
}

console.log(`\nSecurity waves smoke test → ${base}\n`)

await check('Server reachable', async () => {
  const res = await fetch(`${base}/`, { redirect: 'manual', signal: AbortSignal.timeout(8000) })
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
})

await check('Wave 5: CSP-Report-Only header (production only)', async () => {
  const { headers } = await fetchHeaders('/jobs')
  const csp = headers.get('content-security-policy-report-only')
  if (isProd) {
    if (!csp) throw new Error('Missing Content-Security-Policy-Report-Only')
    if (!csp.includes('report-uri /api/csp-report')) throw new Error('Missing report-uri')
    if (!csp.includes('js.stripe.com')) throw new Error('Missing Stripe script-src')
  } else if (csp) {
    throw new Error('CSP-Report-Only should not be set in dev')
  }
})

await check('Wave 5: HSTS header (production only)', async () => {
  const { headers } = await fetchHeaders('/')
  const hsts = headers.get('strict-transport-security')
  if (isProd) {
    if (!hsts?.includes('max-age=')) throw new Error('Missing Strict-Transport-Security')
  } else if (hsts) {
    throw new Error('HSTS should not be set in dev')
  }
})

await check('Wave 5: book route frame-ancestors (next.config)', async () => {
  const { headers } = await fetchHeaders('/book/test-slug')
  const csp = headers.get('content-security-policy')
  if (!csp?.includes('frame-ancestors')) throw new Error('Missing enforcing frame-ancestors on /book')
})

await check('Wave 5: POST /api/csp-report accepts JSON', async () => {
  const res = await fetch(`${base}/api/csp-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'csp-report': {
        'document-uri': `${base}/`,
        'violated-directive': 'script-src',
        'blocked-uri': 'inline',
      },
    }),
  })
  if (res.status !== 204) throw new Error(`Expected 204, got ${res.status}`)
})

await check('Wave 5: CSP report rejects bad content-type', async () => {
  const res = await fetch(`${base}/api/csp-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'not json',
  })
  if (res.status !== 415) throw new Error(`Expected 415, got ${res.status}`)
})

await check('Wave 6: portal/send rejects invalid portalUrl (no auth → 401 first)', async () => {
  const res = await fetch(`${base}/api/portal/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'test@example.com',
      businessName: 'Test Co',
      portalUrl: 'javascript:alert(1)',
      clientName: '<script>x</script>',
    }),
  })
  if (res.status !== 401) throw new Error(`Expected 401 without JWT, got ${res.status}`)
})

await check('Wave 7: signup rate limit returns 429 after threshold', async () => {
  const ip = `smoke-${Date.now()}`
  let lastStatus = 0
  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({
        email: `smoke${i}-${Date.now()}@example.com`,
        password: 'short',
        businessName: 'Smoke Test',
      }),
    })
    lastStatus = res.status
    if (res.status === 429) break
  }
  if (lastStatus !== 429) {
    throw new Error(`Expected 429 after repeated signups, last status ${lastStatus}`)
  }
})

await check('Wave 7: admin backup rejects bad JWT (auth_failure sample)', async () => {
  const res = await fetch(`${base}/api/admin/backups/trigger`, {
    method: 'POST',
    headers: { Authorization: 'Bearer invalid-token-smoke-test' },
  })
  if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
})

await check('Wave 7: Stripe webhook rejects missing signature', async () => {
  const res = await fetch(`${base}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
})

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  process.exit(1)
}

console.log('\nNote: Run unit tests for escapeHtml + Upstash fallback: npm test -- src/lib/server/escape-html.test.ts src/lib/server/csp.test.ts')
console.log('Note: Job photo magic-byte hook is on PocketBase — test via PB PATCH jobs with a .exe renamed .jpg')
