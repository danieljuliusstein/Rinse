import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/server/stripe'
import { syncStripeSubscription } from '@/lib/server/subscription-sync'
import { billingCommand } from '@/lib/server/billing-store'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_OPERATOR_WEBHOOK_SECRET?.trim()
  if (!stripe || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') || '', secret) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  try {
    if (event.account) return NextResponse.json({ error: 'Expected platform event' }, { status: 400 })
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      if (session.metadata?.organization_id) await billingCommand({ action: 'release', orgId: session.metadata.organization_id, generation: Number(session.metadata.generation) })
    } else {
      let id: string | undefined
      if (event.type.startsWith('customer.subscription.')) id = (event.data.object as Stripe.Subscription).id
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        if (session.mode === 'subscription') id = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      }
      if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
        const ref = event.data.object.parent?.subscription_details?.subscription
        id = typeof ref === 'string' ? ref : ref?.id
      }
      if (id) await syncStripeSubscription(stripe, id, event.id, event.created * 1000)
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[operator webhook]', e)
    return NextResponse.json({ error: 'Reconciliation failed; retry required' }, { status: 500 })
  }
}
