import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { logPlatformEvent } from '@/lib/server/platform-events'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await authenticateRequestUser(request)
  if (!auth || !isPlatformAdminEmail(auth.email)) {
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
  if (body.plan === 'founding' || body.plan === 'starter' || body.plan === 'pro') payload.plan = body.plan
  if (body.trial_ends_at) payload.trial_ends_at = body.trial_ends_at
  if (body.subscription_status) payload.subscription_status = body.subscription_status

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
