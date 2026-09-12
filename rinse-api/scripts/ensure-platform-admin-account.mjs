#!/usr/bin/env node
/**
 * Create (or verify) the platform admin HQ account + internal org.
 *
 * Usage: npm run admin:account
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

const HQ_EMAIL = (process.env.PLATFORM_ADMIN_ACCOUNT_EMAIL ?? 'admin@rinsehq.com').trim().toLowerCase()
const HQ_PASSWORD = (process.env.PLATFORM_ADMIN_ACCOUNT_PASSWORD ?? '').trim()
const HQ_SLUG = (process.env.PLATFORM_ADMIN_ORG_SLUG ?? 'rinse-hq-internal').trim()
const HQ_NAME = 'Rinse HQ'

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function adminAuth() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env.local')
    process.exit(1)
  }
  if (!HQ_PASSWORD || HQ_PASSWORD.length < 8) {
    console.error('Set PLATFORM_ADMIN_ACCOUNT_PASSWORD (8+ characters) in .env.local')
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
  console.log(`Platform admin target: ${HQ_EMAIL} → internal org "${HQ_SLUG}"\n`)

  let org = (await list(headers, 'organizations', `slug = "${escapeFilter(HQ_SLUG)}"`))[0]

  const orgPayload = {
    name: HQ_NAME,
    slug: HQ_SLUG,
    is_platform_internal: true,
    plan: 'founding',
    founding_member: true,
    booking_enabled: false,
    subscription_status: 'active',
  }

  if (!org) {
    try {
      org = await create(headers, 'organizations', orgPayload)
    } catch {
      const { is_platform_internal: _ignored, ...withoutFlag } = orgPayload
      org = await create(headers, 'organizations', withoutFlag)
    }
    console.log(`Created internal organization: ${org.id} (${HQ_SLUG})`)
  } else {
    try {
      await patch(headers, 'organizations', org.id, {
        is_platform_internal: true,
        name: HQ_NAME,
        booking_enabled: false,
        subscription_status: 'active',
        plan: 'founding',
      })
    } catch {
      await patch(headers, 'organizations', org.id, {
        name: HQ_NAME,
        booking_enabled: false,
        subscription_status: 'active',
        plan: 'founding',
      })
    }
    console.log(`Internal organization exists: ${org.id} (${org.slug ?? HQ_SLUG})`)
  }

  const orgId = org.id
  let user = (await list(headers, 'users', `email = "${escapeFilter(HQ_EMAIL)}"`))[0]
  if (!user) {
    user = await create(headers, 'users', {
      email: HQ_EMAIL,
      password: HQ_PASSWORD,
      passwordConfirm: HQ_PASSWORD,
      organization_id: orgId,
      verified: true,
    })
    console.log(`Created user: ${HQ_EMAIL}`)
  } else {
    await patch(headers, 'users', user.id, {
      organization_id: orgId,
      verified: true,
      password: HQ_PASSWORD,
      passwordConfirm: HQ_PASSWORD,
    })
    console.log(`Updated user: ${HQ_EMAIL}`)
  }

  const settings = await list(headers, 'app_settings', `organization_id = "${escapeFilter(orgId)}"`)
  const completedAt = new Date().toISOString()
  if (!settings.length) {
    await create(headers, 'app_settings', {
      organization_id: orgId,
      business_name: HQ_NAME,
      business_email: HQ_EMAIL,
      onboarding_step: 4,
      onboarding_completed_at: completedAt,
    })
    console.log('Created minimal app_settings row')
  } else {
    await patch(headers, 'app_settings', settings[0].id, {
      business_name: HQ_NAME,
      business_email: HQ_EMAIL,
      onboarding_step: 4,
      onboarding_completed_at: completedAt,
    })
    console.log('Updated app_settings (onboarding complete)')
  }

  console.log('\n── HQ admin login (/auth/admin) ──')
  console.log(`  Email:    ${HQ_EMAIL}`)
  console.log(`  Console:  /admin`)
  console.log('\nEnsure PLATFORM_ADMIN_EMAILS includes this address in .env.local / Vercel.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
