import { NextResponse } from 'next/server'
import { authenticateServerAdmin } from '@/lib/server/pocketbase-admin'
import { validatePortalToken } from '@/lib/server/portal-tokens'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const record = await validatePortalToken(token)
  if (!record || record.scope !== 'quote' || !record.quote_id) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  }

  try {
    const pb = await authenticateServerAdmin()
    const quote = await pb.collection('quotes').getOne(record.quote_id)

    if (quote.status === 'accepted') {
      return NextResponse.json({ ok: true, alreadyAccepted: true })
    }

    if (quote.status === 'declined' || quote.status === 'expired') {
      return NextResponse.json({ error: 'Quote is no longer available' }, { status: 400 })
    }

    await pb.collection('quotes').update(record.quote_id, { status: 'accepted' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Accept failed' },
      { status: 500 }
    )
  }
}
