import { NextResponse } from 'next/server'
import { parseJsonBody } from '@/lib/server/parse-body'
import { parseReceiptImage } from '@/lib/server/receipt-ocr'
import { requireUser } from '@/lib/server/route-guard'
import { requirePremiumSubscription, requireProPlan } from '@/lib/server/subscription-guard'
import { receiptParseBodySchema } from '@/lib/validation/api-schemas'

export const runtime = 'nodejs'

const RECEIPT_MAX_BYTES = 8_388_608

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof Response) return auth

  const premiumBlock = await requirePremiumSubscription(auth.pb, auth.organizationId)
  if (premiumBlock) return premiumBlock

  const proBlock = await requireProPlan(auth.pb, auth.organizationId)
  if (proBlock) return proBlock

  const parsed = await parseJsonBody(request, receiptParseBodySchema, RECEIPT_MAX_BYTES)
  if (parsed instanceof NextResponse) return parsed

  const { image, mimeType } = parsed.data

  try {
    const result = await parseReceiptImage(image, mimeType?.trim() || 'image/jpeg')
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 500 }
    )
  }
}
