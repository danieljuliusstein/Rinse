import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { refreshConnectStatus } from '@/lib/server/stripe-connect'
import { getStripe } from '@/lib/server/stripe'
export async function GET(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const stripe = getStripe(); if (!stripe) throw new Error('Stripe not configured')
    const status = await refreshConnectStatus(auth.organizationId, auth.pb)
    if (!status.accountId) return NextResponse.json({ payouts: [], payoutsEnabled: false })
    const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: status.accountId })
    return NextResponse.json({ payoutsEnabled: status.payoutsEnabled, payouts: payouts.data.map(p => ({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, arrivalDate: p.arrival_date, failureMessage: p.failure_message })) })
  } catch { return NextResponse.json({ error: 'Payout status unavailable' }, { status: 503 }) }
}
