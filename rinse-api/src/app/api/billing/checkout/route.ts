import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { getStripe, isStripeConfigured, stripeAppOrigin } from '@/lib/server/stripe'
import type { PbRecord } from '@/lib/api/mappers'

export const runtime = 'nodejs'

function stripeErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message
  }
  return 'Checkout failed'
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const auth = await authenticateRequestUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { plan?: string }
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const plan = body.plan === 'pro' ? 'pro' : 'starter'
    const priceId =
      plan === 'pro'
        ? process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()
        : process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim()

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 503 })
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const admin = await authenticateServerAdmin()
    const org = await admin.collection('organizations').getOne<PbRecord>(auth.organizationId)
    const settings = await admin.collection('app_settings').getFullList({
      filter: `organization_id = "${auth.organizationId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
      limit: 1,
    })

    let customerId = String(org.stripe_customer_id ?? '').trim()
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.email,
        name: String(settings[0]?.business_name ?? org.name ?? ''),
        metadata: { organization_id: auth.organizationId },
      })
      customerId = customer.id
      await admin.collection('organizations').update(auth.organizationId, {
        stripe_customer_id: customerId,
      })
    }

    const launchCoupon =
      plan === 'starter' ? process.env.STRIPE_LAUNCH_COUPON_ID?.trim() : undefined

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(launchCoupon ? { discounts: [{ coupon: launchCoupon }] } : {}),
      success_url: `${stripeAppOrigin(request)}/settings/billing?checkout=success`,
      cancel_url: `${stripeAppOrigin(request)}/settings/billing?checkout=cancel`,
      metadata: { organization_id: auth.organizationId, plan },
      subscription_data: {
        metadata: { organization_id: auth.organizationId, plan },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[billing/checkout]', e)
    return NextResponse.json({ error: stripeErrorMessage(e) }, { status: 500 })
  }
}
