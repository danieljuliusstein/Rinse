import { checkoutReturnUrls } from '@/lib/server/desktop-checkout'
import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { getStripe } from '@/lib/server/stripe'
import { billingCommand, type Reservation } from '@/lib/server/billing-store'
import { PRICES } from '../../../../../../packages/core/src/pricing'
export const runtime = 'nodejs'

/** Stripe requires expires_at >= now + 30 minutes. Use 31m for clock skew. */
const STRIPE_MIN_SESSION_SECS = 31 * 60
/** End Checkout a few minutes before the seat reservation so the seat outlives the session. */
const SEAT_BUFFER_SECS = 300

function stripeExpiresAt(reservationExpiresAtMs: number, nowMs = Date.now()): number {
  const nowSec = Math.floor(nowMs / 1000)
  const reservationSec = Math.floor(Number(reservationExpiresAtMs) / 1000)
  const minExpiry = nowSec + STRIPE_MIN_SESSION_SECS
  const preferred = reservationSec - SEAT_BUFFER_SECS
  return Math.max(minExpiry, preferred)
}

function checkoutErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Checkout unavailable'
  const e = error as {
    message?: string
    raw?: { message?: string }
    response?: { message?: string; data?: { message?: string } }
  }
  return (
    e.raw?.message ||
    e.response?.data?.message ||
    e.response?.message ||
    e.message ||
    'Checkout unavailable'
  )
}

async function rotateSeat(
  orgId: string,
  generation: number,
  context: string | undefined,
): Promise<Reservation> {
  await billingCommand({ action: 'release', orgId, generation: Number(generation) })
  return billingCommand<Reservation>({
    action: 'reserve',
    orgId,
    provider: 'stripe',
    returnContext: context,
  })
}

export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  try {
    const text = await request.text()
    let context: string | undefined
    if (text.trim()) {
      let input
      try { input = JSON.parse(text) } catch { return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 }) }
      if (!input || typeof input !== 'object' || Array.isArray(input) || (input.context !== undefined && input.context !== 'desktop_onboarding')) return NextResponse.json({ error: 'Invalid checkout context' }, { status: 400 })
      context = input.context
    }
    // Validate before reserving a seat. The first reservation owns the return destination.
    checkoutReturnUrls(request, context)
    let reservation = await billingCommand<Reservation>({ action: 'reserve', orgId: auth.organizationId, provider: 'stripe', returnContext: context })
    if (reservation.session_id) {
      const existing = await stripe.checkout.sessions.retrieve(reservation.session_id)
      if (existing.status === 'open' && existing.url) return NextResponse.json({ url: existing.url, plan: reservation.plan })
      reservation = await rotateSeat(auth.organizationId, reservation.generation, context)
      if (reservation.session_id) {
        const again = await stripe.checkout.sessions.retrieve(reservation.session_id)
        if (again.status === 'open' && again.url) return NextResponse.json({ url: again.url, plan: reservation.plan })
        return NextResponse.json({ error: 'This checkout is awaiting confirmation or has expired. Refresh your plan before trying again.' }, { status: 409 })
      }
    } else {
      // Unbound pending seats reuse the same generation. Prior failed creates poison Stripe's
      // idempotency cache for that generation — always rotate before creating.
      reservation = await rotateSeat(auth.organizationId, reservation.generation, context)
      if (reservation.session_id) {
        const existing = await stripe.checkout.sessions.retrieve(reservation.session_id)
        if (existing.status === 'open' && existing.url) return NextResponse.json({ url: existing.url, plan: reservation.plan })
      }
    }
    const generation = Number(reservation.generation)
    // Include expires_at so a rotated seat cannot collide with a poisoned prior key for the same generation.
    const key = `rinse:${auth.organizationId}:${generation}:${reservation.expires_at}`
    const admin = await authenticateServerAdmin()
    const org = await admin.collection('organizations').getOne(auth.organizationId)
    let customerId = org.stripe_customer_id ? String(org.stripe_customer_id) : ''
    if (!customerId) {
      const created = await stripe.customers.create(
        { metadata: { organization_id: auth.organizationId } },
        { idempotencyKey: `customer:${auth.organizationId}` },
      )
      customerId = created.id
    }
    const priceId = process.env[reservation.plan === 'early' ? 'STRIPE_PRICE_EARLY_MONTHLY' : 'STRIPE_PRICE_STARTER_MONTHLY']?.trim()
    if (!priceId) throw new Error('Monthly Stripe price not configured')
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active || price.currency !== 'usd' || price.unit_amount !== PRICES[reservation.plan] || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) throw new Error('Stripe price does not match Rinse pricing')
    const metadata = { organization_id: auth.organizationId, plan: reservation.plan, generation: String(generation) }
    const expiresAt = stripeExpiresAt(reservation.expires_at)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer: customerId, payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      expires_at: expiresAt,
      ...checkoutReturnUrls(request, reservation.return_context || context),
      metadata, subscription_data: { metadata },
    }, { idempotencyKey: `checkout:${key}` })
    await billingCommand({ action: 'bind', orgId: auth.organizationId, generation, sessionId: session.id, customerId })
    return NextResponse.json({ url: session.url, plan: reservation.plan })
  } catch (e) {
    // Keep uncertain Stripe requests reserved until expiry; never release a possibly payable session.
    return NextResponse.json({ error: checkoutErrorMessage(e) }, { status: 409 })
  }
}
