import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logAuditEvent } from '@/lib/server/audit-log'
import { logPlatformEvent } from '@/lib/server/platform-events'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { getStripe, isStripeConfigured } from '@/lib/server/stripe'
import type { PbRecord } from '@/lib/api/mappers'

export const runtime = 'nodejs'

function isoDate(unix?: number | null): string | undefined {
  if (!unix) return undefined
  return new Date(unix * 1000).toISOString().slice(0, 10)
}

async function updateOrgFromSubscription(orgId: string, subscription: Stripe.Subscription) {
  const admin = await authenticateServerAdmin()
  const status = subscription.status
  const mapped =
    status === 'trialing'
      ? 'trialing'
      : status === 'active'
        ? 'active'
        : status === 'past_due'
          ? 'past_due'
          : status === 'canceled' || status === 'unpaid'
            ? 'canceled'
            : 'none'

  const plan = String(subscription.metadata?.plan ?? '').trim() || undefined
  const periodEnd =
    'current_period_end' in subscription
      ? (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
      : subscription.items?.data?.[0]?.current_period_end

  const payload: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: mapped,
    current_period_end: isoDate(periodEnd),
    trial_ends_at: isoDate(subscription.trial_end),
  }
  if (plan === 'starter' || plan === 'pro') payload.plan = plan
  if (mapped === 'canceled') payload.booking_enabled = false

  await admin.collection('organizations').update(orgId, payload)

  void logPlatformEvent('subscription_status_changed', {
    organizationId: orgId,
    detail: `${mapped}${plan ? ` · ${plan}` : ''}`,
    metadata: {
      stripe_subscription_id: subscription.id,
      status: mapped,
      plan: plan ?? null,
      event_source: 'operator_webhook',
    },
  })
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_OPERATOR_WEBHOOK_SECRET?.trim()
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Operator webhook not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    logAuditEvent('webhook_reject', {
      route: '/api/stripe/operator-webhook',
      reason: 'missing_signature',
    })
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (e) {
    logAuditEvent('webhook_reject', {
      route: '/api/stripe/operator-webhook',
      reason: 'invalid_signature',
      detail: e instanceof Error ? e.message : 'unknown',
    })
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid signature' },
      { status: 400 },
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode === 'subscription' && session.subscription) {
      const orgId = session.metadata?.organization_id
      if (orgId) {
        const sub =
          typeof session.subscription === 'string'
            ? await stripe.subscriptions.retrieve(session.subscription)
            : session.subscription
        await updateOrgFromSubscription(orgId, sub)
      }
    }
  }

  if (event.type.startsWith('customer.subscription.')) {
    const subscription = event.data.object as Stripe.Subscription
    const orgId = subscription.metadata?.organization_id
    if (orgId) {
      await updateOrgFromSubscription(orgId, subscription)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subRef =
      (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription ??
      invoice.parent?.subscription_details?.subscription
    const subId = typeof subRef === 'string' ? subRef : subRef?.id
    if (subId) {
      const subscription = await stripe.subscriptions.retrieve(subId)
      const orgId = subscription.metadata?.organization_id
      if (orgId) {
        await authenticateServerAdmin().then((admin) =>
          admin.collection('organizations').update(orgId, { subscription_status: 'past_due' }),
        )
        void logPlatformEvent('invoice_payment_failed', {
          organizationId: orgId,
          detail: `Subscription ${subId}`,
          metadata: { stripe_subscription_id: subId, invoice_id: invoice.id },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
