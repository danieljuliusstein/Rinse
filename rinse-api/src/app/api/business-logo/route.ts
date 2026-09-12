import { NextResponse } from 'next/server'
import { streamBusinessLogo } from '@/lib/server/portal-data'

/** Public business logo — optional ?slug= for multi-tenant */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim() ?? undefined
  const result = await streamBusinessLogo(slug)
  if (!result) {
    return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
  }

  return new NextResponse(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
