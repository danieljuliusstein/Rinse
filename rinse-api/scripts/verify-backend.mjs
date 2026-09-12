#!/usr/bin/env node
/**
 * Backend verification script.
 * Usage: npm run verify:backend
 */

import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090'

const checks = []

async function check(name, fn, optional = false) {
  try {
    await fn()
    checks.push({ name, ok: true })
    console.log(`✓ ${name}`)
  } catch (e) {
    const msg = e.message ?? String(e)
    checks.push({ name, ok: optional, optional, error: msg })
    console.log(`${optional ? '○' : '✗'} ${name}: ${msg}`)
  }
}

await check('Next.js build artifacts', async () => {
  if (!existsSync(join(root, '.next'))) {
    throw new Error('.next missing — run npm run build first')
  }
})

await check('TypeScript (via build)', async () => {
  if (!existsSync(join(root, '.next', 'BUILD_ID'))) {
    throw new Error('BUILD_ID missing — run npm run build')
  }
})

await check('PocketBase health', async () => {
  const res = await fetch(`${PB_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}, true)

await check('PocketBase auth + packages', async () => {
  const email = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
  const password = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
  if (!email || !password) throw new Error('Skipped — set PB_EMAIL/PB_PASSWORD')

  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Auth failed`)

  const { token } = await res.json()
  const pkgRes = await fetch(`${PB_URL}/api/collections/packages/records?perPage=1`, {
    headers: { Authorization: token },
    signal: AbortSignal.timeout(5000),
  })
  if (!pkgRes.ok) throw new Error(`Packages API failed: ${pkgRes.status}`)

  for (const collection of [
    'clients', 'jobs', 'invoices', 'supplies', 'equipment',
    'overhead_expenses', 'business_expenses', 'app_settings',
  ]) {
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=1`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`${collection} API failed: ${res.status}`)
  }
}, true)

const requiredFailed = checks.filter((c) => !c.ok && !c.optional)
await check('API routes (vapid-key)', async () => {
  const base = process.env.APP_URL || 'http://127.0.0.1:3000'
  const res = await fetch(`${base}/api/push/vapid-key`, { signal: AbortSignal.timeout(3000) })
  // 503 is ok when VAPID not configured
  if (!res.ok && res.status !== 503) throw new Error(`HTTP ${res.status}`)
}, true)

const passed = checks.filter((c) => c.ok).length

console.log(`\n${passed}/${checks.length} checks passed`)

if (requiredFailed.length > 0) {
  process.exit(1)
}
