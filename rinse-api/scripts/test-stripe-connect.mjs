#!/usr/bin/env node
/**
 * Seed invoice test data, link Connect account (optional), and smoke-test portal checkout.
 * Usage:
 *   node scripts/test-stripe-connect.mjs
 *   STRIPE_CONNECT_ACCOUNT_ID=acct_xxx node scripts/test-stripe-connect.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
}

const PB_URL = (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
const EMAIL = process.env.PB_EMAIL || process.env.NEXT_PUBLIC_PB_EMAIL
const PASSWORD = process.env.PB_PASSWORD || process.env.NEXT_PUBLIC_PB_PASSWORD
const CONNECT_ACCOUNT =
  process.env.STRIPE_CONNECT_ACCOUNT_ID?.trim() || 'acct_1TmnsyRYKnDTaoFa'

async function detectAppUrl() {
  for (const port of [3000, 3001]) {
    const url = `http://127.0.0.1:${port}`
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status < 500) return url
    } catch {
      // try next port
    }
  }
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000').replace(
    /\/$/,
    '',
  )
}

async function pbAuth() {
  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const data = await res.json()
  return { token: data.token, organizationId: data.record?.organization_id }
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

async function stripeGet(path) {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  return { ok: res.ok, data: await res.json() }
}

async function main() {
  console.log('═══ Stripe Connect end-to-end test ═══\n')

  const appUrl = await detectAppUrl()
  console.log(`App URL: ${appUrl}`)

  console.log('\n1. Seeding test client + invoice + portal link…')
  const seed = spawnSync('node', ['scripts/seed-stripe-test.mjs'], {
    cwd: root,
    env: { ...process.env, APP_URL: appUrl, NEXT_PUBLIC_APP_URL: appUrl },
    encoding: 'utf8',
  })
  process.stdout.write(seed.stdout)
  if (seed.stderr) process.stderr.write(seed.stderr)
  if (seed.status !== 0) {
    console.error('Seed failed — is npm run dev running?')
    process.exit(1)
  }

  const portalMatch = seed.stdout.match(/(https?:\/\/[^\s]+\/portal\/[^\s]+)/)
  const portalUrl = portalMatch?.[1]
  if (!portalUrl) {
    console.error('Could not parse portal URL from seed output')
    process.exit(1)
  }
  const token = portalUrl.split('/portal/')[1]?.replace(/[^\w-].*$/, '') ?? ''

  console.log('\n2. Linking Connect account to organization…')
  const { token: pbToken, organizationId } = await pbAuth()
  if (!organizationId) throw new Error('No organization_id on user')

  const linkRes = await pbPatch(pbToken, 'organizations', organizationId, {
    stripe_connect_account_id: CONNECT_ACCOUNT,
  })
  if (!linkRes.ok) {
    console.error('Could not link Connect account:', linkRes.data)
    process.exit(1)
  }
  console.log(`   ✓ Linked ${CONNECT_ACCOUNT} → org ${organizationId}`)

  console.log('\n3. Stripe Connect account status (live API)…')
  const acct = await stripeGet(`/accounts/${CONNECT_ACCOUNT}`)
  if (!acct.ok) {
    console.log(`   ✗ ${acct.data?.error?.message ?? 'Could not retrieve account'}`)
  } else {
    const a = acct.data
    console.log(`   charges_enabled: ${a.charges_enabled}`)
    console.log(`   details_submitted: ${a.details_submitted}`)
    console.log(`   payouts_enabled: ${a.payouts_enabled}`)
    if (!a.charges_enabled || !a.details_submitted) {
      console.log('   ⚠ Onboarding incomplete — Pay online will be blocked until Stripe enables the account.')
    }
  }

  await pbPatch(pbToken, 'organizations', organizationId, {
    stripe_connect_charges_enabled: acct.ok ? acct.data.charges_enabled === true : false,
  })

  console.log('\n4. Portal checkout smoke test…')
  const checkoutUrl = `${appUrl}/api/portal/${token}/checkout`
  const checkoutRes = await fetch(checkoutUrl, { redirect: 'manual' })
  const location = checkoutRes.headers.get('location') ?? ''

  if (checkoutRes.status >= 300 && checkoutRes.status < 400 && location.includes('checkout.stripe.com')) {
    console.log('   ✓ Checkout session created — would redirect to Stripe Checkout')
    console.log(`   ${location.slice(0, 80)}…`)
  } else if (checkoutRes.status >= 300 && checkoutRes.status < 400 && location.includes('pay_error')) {
    const err = decodeURIComponent(location.split('pay_error=')[1]?.split('&')[0] ?? '')
    console.log(`   ✗ Checkout blocked: ${err}`)
    if (err.includes('not set up')) {
      console.log('   → Finish Settings → Invoicing → Connect Stripe onboarding in the app.')
    }
  } else {
    console.log(`   Unexpected response: ${checkoutRes.status}`)
    console.log(`   Location: ${location || '(none)'}`)
  }

  console.log('\n── Open in browser ──')
  console.log(`Portal:   ${portalUrl}`)
  console.log(`Invoicing: ${appUrl}/settings/invoicing`)
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
