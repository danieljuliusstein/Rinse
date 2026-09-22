import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { getStripe, stripeAppOrigin } from '@/lib/server/stripe'
import { billingCommand, type Reservation } from '@/lib/server/billing-store'
import { PRICES } from '../../../../../../packages/core/src/pricing'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  try {
    const reservation = await billingCommand<Reservation>({ action: 'reserve', orgId: auth.organizationId, provider: 'stripe' })
    // Deterministic provider keys make simultaneous/retried requests reuse the same customer/session.
    const key = `rinse:${auth.organizationId}:${reservation.generation}`
    const org = await (await authenticateServerAdmin()).collection('organizations').getOne(auth.organizationId)
    const customer = org.stripe_customer_id ? { id: String(org.stripe_customer_id) } : await stripe.customers.create({ metadata: { organization_id: auth.organizationId } }, { idempotencyKey: `customer:${auth.organizationId}` })
    const priceId = process.env[reservation.plan === 'early' ? 'STRIPE_PRICE_EARLY_MONTHLY' : 'STRIPE_PRICE_STARTER_MONTHLY']?.trim()
    if (!priceId) throw new Error('Monthly Stripe price not configured')
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active || price.currency !== 'usd' || price.unit_amount !== PRICES[reservation.plan] || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) throw new Error('Stripe price does not match Rinse pricing')
    const metadata = { organization_id: auth.organizationId, plan: reservation.plan, generation: String(reservation.generation) }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer: customer.id, payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      expires_at: Math.floor(reservation.expires_at / 1000) - 300,
      success_url: `${stripeAppOrigin(request)}/billing/return?result=success`,
      cancel_url: `${stripeAppOrigin(request)}/billing/return?result=cancel`,
      metadata, subscription_data: { metadata },
    }, { idempotencyKey: `checkout:${key}` })
    await billingCommand({ action: 'bind', orgId: auth.organizationId, generation: reservation.generation, sessionId: session.id, customerId: customer.id })
    return NextResponse.json({ url: session.url, plan: reservation.plan })
  } catch (e) {
    // Keep uncertain Stripe requests reserved until expiry; never release a possibly payable session.
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout unavailable' }, { status: 409 })
  }
}
