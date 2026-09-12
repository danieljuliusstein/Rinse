import { NextResponse } from 'next/server'
import { buildPortalPayload } from '@/lib/server/portal-data'
import { getAppBaseUrl, validatePortalToken } from '@/lib/server/portal-tokens'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const record = await validatePortalToken(token)
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const payload = await buildPortalPayload(record, getAppBaseUrl())
  if (!payload) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  return NextResponse.json(payload)
}
