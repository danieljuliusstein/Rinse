import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logAuditEvent } from '@/lib/server/audit-log'
import { addPaymentServer, getInvoiceServer } from '@/lib/server/invoices-server'
import { syncConnectAccountToOrg } from '@/lib/server/stripe-connect'
import { getStripe, isStripeConfigured } from '@/lib/server/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    logAuditEvent('webhook_reject', { route: '/api/stripe/webhook', reason: 'missing_signature' })
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (e) {
    logAuditEvent('webhook_reject', {
      route: '/api/stripe/webhook',
      reason: 'invalid_signature',
      detail: e instanceof Error ? e.message : 'unknown',
    })
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid signature' },
      { status: 400 },
    )
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const orgId = String(account.metadata?.organization_id ?? '').trim()
    if (orgId) {
      await syncConnectAccountToOrg(orgId, account)
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const invoiceId = session.metadata?.invoice_id
    if (!invoiceId) {
      // Subscription checkouts use /api/stripe/operator-webhook — ignore here.
      return NextResponse.json({ received: true, skipped: 'not_invoice_checkout' })
    }

    const invoice = await getInvoiceServer(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const sessionRef = `Stripe checkout ${session.id}`
    if (invoice.payments.some((p) => p.note === sessionRef)) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    const amount = (session.amount_total ?? 0) / 100
    if (amount > 0) {
      await addPaymentServer(invoiceId, {
        amount,
        method: 'stripe',
        date: new Date().toISOString().slice(0, 10),
        note: sessionRef,
      })
    }
  }

  return NextResponse.json({ received: true })
}
