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
  return 'Could not open billing portal'
}

function portalReturnUrl(request: Request, context?: string): string {
  if (context === 'desktop_onboarding') {
    const configured = process.env.DESKTOP_APP_ORIGIN?.trim()
    if (!configured) throw new Error('Desktop checkout return is not configured')
    const url = new URL(configured)
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    ) {
      throw new Error('Desktop checkout requires a trusted HTTPS origin (or localhost)')
    }
    return `${url.origin}/?desktop_billing=manage`
  }
  return `${stripeAppOrigin(request)}/billing/return`
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

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const body = (await request.json().catch(() => ({}))) as { context?: string }
    const admin = await authenticateServerAdmin()
    const org = await admin.collection('organizations').getOne<PbRecord>(auth.organizationId)
    const customerId = String(org.stripe_customer_id ?? '').trim()

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account yet — subscribe first' }, { status: 400 })
    }

    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION?.trim()
    if (!configuration) return NextResponse.json({ error: 'Billing management is not configured' }, { status: 503 })
    if (org.billing_provider === 'apple') return NextResponse.json({ error: 'Manage this subscription with Apple' }, { status: 409 })
    const session = await stripe.billingPortal.sessions.create({
      configuration,
      customer: customerId,
      return_url: portalReturnUrl(request, body.context),
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[billing/portal]', e)
    return NextResponse.json({ error: stripeErrorMessage(e) }, { status: 500 })
  }
}
