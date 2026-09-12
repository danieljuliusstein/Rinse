import { NextResponse } from 'next/server'
import { streamPortalPhoto } from '@/lib/server/portal-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; filename: string }> }
) {
  const { token, filename } = await params
  const decoded = decodeURIComponent(filename)
  const result = await streamPortalPhoto(token, decoded)

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
