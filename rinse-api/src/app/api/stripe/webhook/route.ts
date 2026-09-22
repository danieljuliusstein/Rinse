import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { syncConnectAccountToOrg } from '@/lib/server/stripe-connect'
import { reconcileCharge, reconcileDeposit } from '@/lib/server/payment-sync'
import { getStripe } from '@/lib/server/stripe'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripe || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') || '', secret) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  try {
    if (!event.account) return NextResponse.json({ received: true, skipped: 'not_connected_account' })
    if (event.type === 'account.updated') {
      const account = await stripe.accounts.retrieve(event.account)
      if (account.metadata?.organization_id) await syncConnectAccountToOrg(account.metadata.organization_id, account)
    }
    if (event.type === 'charge.succeeded' || event.type === 'charge.refunded') await reconcileCharge(stripe, event.account, event.data.object.id)
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (session.mode === 'payment' && session.payment_status === 'paid') {
        if (session.metadata?.type === 'deposit' && session.metadata?.job_id) {
          const depositAmt = session.metadata.deposit_amount ? parseFloat(session.metadata.deposit_amount) : undefined
          await reconcileDeposit(session.metadata.job_id, depositAmt)
        } else if (session.payment_intent) {
          const id = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
          const payment = await stripe.paymentIntents.retrieve(id, {}, { stripeAccount: event.account })
          const charge = typeof payment.latest_charge === 'string' ? payment.latest_charge : payment.latest_charge?.id
          if (charge) await reconcileCharge(stripe, event.account, charge)
        }
      }
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[payment webhook]', e)
    return NextResponse.json({ error: 'Reconciliation failed; retry required' }, { status: 500 })
  }
}
