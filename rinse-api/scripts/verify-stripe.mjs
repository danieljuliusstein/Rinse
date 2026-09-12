#!/usr/bin/env node
/**
 * Verify Stripe live config and document the two billing flows.
 * Usage: node scripts/verify-stripe.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
}

function mask(value) {
  const v = String(value ?? '').trim()
  if (!v) return '(missing)'
  if (v.length <= 12) return `${v.slice(0, 4)}…`
  return `${v.slice(0, 8)}…${v.slice(-4)}`
}

function check(name, value) {
  const ok = Boolean(String(value ?? '').trim())
  return { name, ok, display: ok ? mask(value) : '(missing)' }
}

async function stripeGet(path) {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ''
  const mode =
    secret.startsWith('sk_live_') || publishable.startsWith('pk_live_')
      ? 'LIVE'
      : secret.startsWith('sk_test_') || publishable.startsWith('pk_test_')
        ? 'TEST'
        : 'UNKNOWN'

  const envChecks = [
    check('STRIPE_SECRET_KEY', secret),
    check('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', publishable),
    check('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET),
    check('STRIPE_OPERATOR_WEBHOOK_SECRET', process.env.STRIPE_OPERATOR_WEBHOOK_SECRET),
    check('STRIPE_PRICE_STARTER_MONTHLY', process.env.STRIPE_PRICE_STARTER_MONTHLY),
    check('STRIPE_LAUNCH_COUPON_ID', process.env.STRIPE_LAUNCH_COUPON_ID),
  ]

  console.log('═══ Stripe configuration ═══\n')
  console.log(`Mode: ${mode}`)
  if (secret && publishable) {
    const secretLive = secret.startsWith('sk_live_')
    const pubLive = publishable.startsWith('pk_live_')
    if (secretLive !== pubLive) {
      console.log('⚠️  MISMATCH: secret and publishable keys are not both live or both test')
    }
  }

  console.log('\nEnvironment:')
  for (const row of envChecks) {
    console.log(`  ${row.ok ? '✓' : '✗'} ${row.name}: ${row.display}`)
  }

  if (!secret) {
    console.error('\nCannot call Stripe API without STRIPE_SECRET_KEY')
    process.exit(1)
  }

  console.log('\n═══ Stripe API checks ═══\n')

  const account = await stripeGet('/account')
  if (!account.ok) {
    console.log(`✗ Account: ${account.data?.error?.message ?? account.status}`)
  } else {
    console.log(`✓ Account: ${account.data.business_profile?.name || account.data.settings?.dashboard?.display_name || account.data.id}`)
    console.log(`  Country: ${account.data.country}`)
    console.log(`  Charges enabled: ${account.data.charges_enabled}`)
    console.log(`  Payouts enabled: ${account.data.payouts_enabled}`)
  }

  const priceId = process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim()
  if (priceId) {
    const price = await stripeGet(`/prices/${priceId}?expand[]=product`)
    if (!price.ok) {
      console.log(`\n✗ Starter price (${mask(priceId)}): ${price.data?.error?.message ?? price.status}`)
      if (mode === 'LIVE' && price.data?.error?.code === 'resource_missing') {
        console.log('  Hint: live keys need a live-mode price id (create product in live dashboard).')
      }
    } else {
      const amount = (price.data.unit_amount ?? 0) / 100
      const productName = price.data.product?.name ?? price.data.product
      console.log(`\n✓ Starter price: ${productName} — $${amount}/${price.data.recurring?.interval ?? 'once'}`)
      console.log(`  Active: ${price.data.active}`)
      if (price.data.livemode !== undefined && mode === 'LIVE' && !price.data.livemode) {
        console.log('  ⚠️  Price is TEST mode but keys are LIVE')
      }
      if (price.data.livemode !== undefined && mode === 'TEST' && price.data.livemode) {
        console.log('  ⚠️  Price is LIVE mode but keys are TEST')
      }
    }
  }

  const couponId = process.env.STRIPE_LAUNCH_COUPON_ID?.trim()
  if (couponId) {
    const coupon = await stripeGet(`/coupons/${couponId}`)
    if (!coupon.ok) {
      console.log(`\n✗ Launch coupon (${couponId}): ${coupon.data?.error?.message ?? coupon.status}`)
    } else {
      const off =
        coupon.data.percent_off != null
          ? `${coupon.data.percent_off}% off`
          : `$${(coupon.data.amount_off ?? 0) / 100} off`
      console.log(`\n✓ Launch coupon: ${couponId} — ${off}, duration ${coupon.data.duration}`)
    }
  }

  console.log('\n═══ Two billing flows (code architecture) ═══\n')
  console.log('Flow A — Operator pays YOU (Rinse subscription)')
  console.log('  Route:     POST /api/billing/checkout')
  console.log('  Checkout:  mode=subscription, metadata.organization_id')
  console.log('  Webhook:   POST /api/stripe/operator-webhook')
  console.log('  Product:   Rinse Starter ($29/mo, optional launch coupon)')
  console.log('  Money to:  YOUR platform Stripe account ✓ (correct for SaaS)\n')

  console.log('Flow B — Client pays operator (invoice via portal)')
  console.log('  Route:     GET/POST /api/portal/[token]/checkout')
  console.log('  Checkout:  mode=payment, metadata.invoice_id')
  console.log('  Connect:   transfer_data.destination → operator Express account')
  console.log('  Webhook:   POST /api/stripe/webhook (+ account.updated for Connect)')
  console.log('  Money to:  OPERATOR connected account (via destination charge)')
  console.log('  Requires:  Settings → Invoicing → Connect Stripe\n')

  console.log('═══ Verdict ═══\n')
  console.log(
    'Operator subscriptions (Flow A) charge YOUR platform account.',
  )
  console.log(
    'Client invoice payments (Flow B) transfer to each operator\'s Connect account',
  )
  console.log('after they complete Settings → Invoicing → Connect Stripe.\n')

  console.log('Webhook routing (must be separate endpoints in Stripe Dashboard):')
  console.log('  Invoice payments  → /api/stripe/webhook          (needs invoice_id metadata)')
  console.log('  Subscriptions     → /api/stripe/operator-webhook (needs organization_id metadata)')
  console.log('')
  console.log(
    'If both event types hit only /api/stripe/webhook, subscription checkouts will fail',
  )
  console.log('webhook validation (missing invoice_id). Split endpoints in Stripe.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
