import { NextResponse } from 'next/server'

/** @deprecated Use /api/business-logo?slug=... */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json(
      { error: 'slug query param required — use /api/business-logo?slug=your-org' },
      { status: 400 }
    )
  }
  const target = new URL('/api/business-logo', request.url)
  target.searchParams.set('slug', slug)
  return NextResponse.redirect(target)
}
