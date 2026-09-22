import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { appleAccountToken, appleProduct, appleServices } from '@/lib/server/apple-billing'
import { billingCommand, type Reservation } from '@/lib/server/billing-store'
export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    appleServices() // fail before reserving when store verification is not configured
    const reservation = await billingCommand<Reservation>({ action: 'reserve', orgId: auth.organizationId, provider: 'apple' })
    const productId = appleProduct(reservation.plan)
    const appAccountToken = appleAccountToken(auth.organizationId)
    await billingCommand({ action: 'bind', orgId: auth.organizationId, generation: reservation.generation, sessionId: productId, accountToken: appAccountToken })
    return NextResponse.json({ productId, appAccountToken, plan: reservation.plan })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Purchases unavailable' }, { status: 409 }) }
}
