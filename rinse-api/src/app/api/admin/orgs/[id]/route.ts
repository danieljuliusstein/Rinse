import { billingCommand } from '@/lib/server/billing-store'
import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { logPlatformEvent } from '@/lib/server/platform-events'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await authenticateRequestUser(request)
  if (!auth || !auth.verified || !isPlatformAdminEmail(auth.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  let body: {
    booking_enabled?: boolean
    plan?: string
    trial_ends_at?: string
    subscription_status?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  if (typeof body.booking_enabled === 'boolean') payload.booking_enabled = body.booking_enabled
  if (body.plan === 'founding') {
    try { await billingCommand({ action: 'founding', orgId: id }); return NextResponse.json({ ok: true }) }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Cannot grant Founding' }, { status: 409 }) }
  }

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const pb = await authenticateServerAdmin()
  const updated = await pb.collection('organizations').update(id, payload)

  void logPlatformEvent('admin_org_updated', {
    organizationId: id,
    actorEmail: auth.email,
    detail: Object.keys(payload).join(', '),
    metadata: { changes: payload },
  })

  return NextResponse.json({
    org: {
      id: updated.id,
      name: String(updated.name ?? ''),
      slug: String(updated.slug ?? ''),
      plan: String(updated.plan ?? ''),
      subscription_status: String(updated.subscription_status ?? 'none'),
      trial_ends_at: updated.trial_ends_at ? String(updated.trial_ends_at) : null,
      current_period_end: updated.current_period_end ? String(updated.current_period_end) : null,
      founding_member: updated.founding_member === true,
      booking_enabled: updated.booking_enabled !== false,
      stripe_customer_id: updated.stripe_customer_id ? String(updated.stripe_customer_id) : null,
      stripe_subscription_id: updated.stripe_subscription_id ? String(updated.stripe_subscription_id) : null,
      created: updated.created,
    },
  })
}
