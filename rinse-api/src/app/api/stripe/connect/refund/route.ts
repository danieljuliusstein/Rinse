import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { getStripe } from '@/lib/server/stripe'
import { reconcileCharge } from '@/lib/server/payment-sync'
export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { chargeId, requestId, amount } = await request.json()
    if (typeof chargeId !== 'string' || !/^ch_[a-zA-Z0-9]+$/.test(chargeId) || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) || (amount !== undefined && (!Number.isInteger(amount) || amount <= 0))) return NextResponse.json({ error: 'Valid charge, request ID and integer cent amount required' }, { status: 400 })
    const stripe = getStripe(); if (!stripe) throw new Error('Stripe not configured')
    const org = await auth.pb.collection('organizations').getOne(auth.organizationId)
    const accountId = String(org.stripe_connect_account_id || '')
    if (!accountId) throw new Error('Payments are not configured')
    const charge = await stripe.charges.retrieve(chargeId, {}, { stripeAccount: accountId })
    const invoice = await auth.pb.collection('invoices').getOne(charge.metadata.invoice_id)
    if (invoice.organization_id !== auth.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const refund = await stripe.refunds.create({ charge: chargeId, amount }, { stripeAccount: accountId, idempotencyKey: `refund:${auth.organizationId}:${requestId}` })
    await reconcileCharge(stripe, accountId, chargeId)
    return NextResponse.json({ id: refund.id, status: refund.status })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Refund failed' }, { status: 400 }) }
}
