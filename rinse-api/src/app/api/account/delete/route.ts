import { NextResponse } from 'next/server'
import { deleteOrganizationAccount } from '@/lib/server/account-delete'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/server/rate-limit'
import { rejectOversizedBody } from '@/lib/server/request-body'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tooLarge = rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await enforceRateLimit(
    `account-delete:${auth.userId}`,
    RATE_LIMITS.accountDelete,
    'account-delete',
  )
  if (limited) return limited

  let body: { businessName?: string; confirmed?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.confirmed) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  const pb = await authenticateServerAdmin()
  const settings = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${auth.organizationId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
    limit: 1,
  })
  const expectedName = String(settings[0]?.business_name ?? '').trim()
  const provided = String(body.businessName ?? '').trim()

  if (!expectedName || provided !== expectedName) {
    return NextResponse.json({ error: 'Business name does not match' }, { status: 400 })
  }

  try {
    await deleteOrganizationAccount(auth.organizationId, auth.userId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Account deletion failed' },
      { status: 500 },
    )
  }
}
