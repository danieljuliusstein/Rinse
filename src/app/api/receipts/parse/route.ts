import { NextResponse } from 'next/server'
import { authenticateRequestUser } from '@/lib/server/request-auth'
import { authenticateServerPocketBase } from '@/lib/server/pocketbase-admin'
import { requirePremiumSubscription, requireProPlan } from '@/lib/server/subscription-guard'
import { parseReceiptImage } from '@/lib/server/receipt-ocr'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await authenticateRequestUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pb = await authenticateServerPocketBase()
  const premiumBlock = await requirePremiumSubscription(pb, auth.organizationId)
  if (premiumBlock) return premiumBlock

  const proBlock = await requireProPlan(pb, auth.organizationId)
  if (proBlock) return proBlock

  let body: { image?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const image = body.image?.trim()
  const mimeType = body.mimeType?.trim() || 'image/jpeg'
  if (!image) {
    return NextResponse.json({ error: 'image required' }, { status: 400 })
  }

  try {
    const result = await parseReceiptImage(image, mimeType)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 500 }
    )
  }
}
