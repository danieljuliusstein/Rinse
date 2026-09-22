import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { EARLY_SEAT_LIMIT, STARTER_PLAN, EARLY_PLAN, FREE_PLAN } from '../../../../../../packages/core/src/pricing'
export async function GET() {
  try {
    const pb = await authenticateServerAdmin()
    const allocated = await pb.collection('early_allocations').getList(1, 1)
    const pending = await pb.collection('billing_checkouts').getList(1, 1, { filter: `plan = "early" && consumed = false && state = "pending" && expires_at > ${Date.now()}` })
    const remaining = Math.max(0, EARLY_SEAT_LIMIT - allocated.totalItems - pending.totalItems)
    return NextResponse.json({ offer: remaining ? 'early' : 'starter', early: { limit: EARLY_SEAT_LIMIT, remaining, available: remaining > 0, priceLabel: EARLY_PLAN.priceLabel }, starter: { priceLabel: STARTER_PLAN.priceLabel }, free: { priceLabel: FREE_PLAN.priceLabel } })
  } catch { return NextResponse.json({ error: 'Pricing availability unavailable' }, { status: 503 }) }
}
