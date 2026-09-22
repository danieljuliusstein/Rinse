import { checkoutReturnUrls } from '@/lib/server/desktop-checkout'
import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { getStripe } from '@/lib/server/stripe'
import { billingCommand, type Reservation } from '@/lib/server/billing-store'
import { PRICES } from '../../../../../../packages/core/src/pricing'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const stripe = getStripe()
  if (!stripe) {
    // #region agent log
    fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'checkout-debug',hypothesisId:'H9',location:'billing/checkout/route.ts',message:'stripe not configured',data:{hasSecretKey:!!process.env.STRIPE_SECRET_KEY?.trim(),hasDesktopOrigin:!!process.env.DESKTOP_APP_ORIGIN,hasStarterPrice:!!process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim(),hasEarlyPrice:!!process.env.STRIPE_PRICE_EARLY_MONTHLY?.trim()},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
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
    const reservation = await billingCommand<Reservation>({ action: 'reserve', orgId: auth.organizationId, provider: 'stripe', returnContext: context })
    if (reservation.session_id) {
      const existing = await stripe.checkout.sessions.retrieve(reservation.session_id)
      if (existing.status === 'open' && existing.url) return NextResponse.json({ url: existing.url, plan: reservation.plan })
      return NextResponse.json({ error: 'This checkout is awaiting confirmation or has expired. Refresh your plan before trying again.' }, { status: 409 })
    }
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
      ...checkoutReturnUrls(request, reservation.return_context),
      metadata, subscription_data: { metadata },
    }, { idempotencyKey: `checkout:${key}` })
    await billingCommand({ action: 'bind', orgId: auth.organizationId, generation: reservation.generation, sessionId: session.id, customerId: customer.id })
    // #region agent log
    fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'checkout-debug',hypothesisId:'H9',location:'billing/checkout/route.ts:success',message:'checkout session created',data:{plan:reservation.plan,hasUrl:!!session.url,context:context??null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return NextResponse.json({ url: session.url, plan: reservation.plan })
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'checkout-debug',hypothesisId:'H10',location:'billing/checkout/route.ts:catch',message:'checkout failed',data:{errorMessage:e instanceof Error?e.message:String(e),hasDesktopOrigin:!!process.env.DESKTOP_APP_ORIGIN,hasStarterPrice:!!process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim(),hasEarlyPrice:!!process.env.STRIPE_PRICE_EARLY_MONTHLY?.trim()},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    // Keep uncertain Stripe requests reserved until expiry; never release a possibly payable session.
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Checkout unavailable' }, { status: 409 })
  }
}
