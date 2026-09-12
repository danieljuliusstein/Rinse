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

    const admin = await authenticateServerAdmin()
    const org = await admin.collection('organizations').getOne<PbRecord>(auth.organizationId)
    const customerId = String(org.stripe_customer_id ?? '').trim()

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account yet — subscribe first' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${stripeAppOrigin(request)}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[billing/portal]', e)
    return NextResponse.json({ error: stripeErrorMessage(e) }, { status: 500 })
  }
}
