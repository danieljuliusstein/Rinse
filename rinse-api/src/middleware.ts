import { deskCorsHeaders } from '@/lib/server/desk-cors'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  buildContentSecurityPolicyReportOnly,
  HSTS_HEADER_VALUE,
  shouldApplyProductionSecurityHeaders,
} from '@/lib/server/csp'
import { extractSlugFromPath, getAllowedOriginsForSlug } from '@/lib/server/origin-resolver'

export async function middleware(request: NextRequest) {
  // Retired operator PWA. Keep APIs, customer pages, admin and auth callbacks intact.
  const path = request.nextUrl.pathname
  const legacy = ['/', '/auth', '/welcome', '/intro'].includes(path) || /^\/(settings|jobs|clients|invoices|quotes|pipeline|reports|inventory|supplies|onboarding|setup|demo)(\/|$)/.test(path)
  if (legacy) return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'https://rinsehq.com'))
  const billingApi = /^\/api\/(billing|stripe\/connect)(\/|$)/.test(path)
  if (billingApi && request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: deskCorsHeaders(request) })
  const response = NextResponse.next()
  if (billingApi) for (const [key, value] of Object.entries(deskCorsHeaders(request))) response.headers.set(key, value)
  const pathname = request.nextUrl.pathname

  if (!pathname.startsWith('/book/') && !pathname.startsWith('/embed/')) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  let tenantOrigins: string[] = []
  if (pathname.startsWith('/book/') || pathname.startsWith('/embed/book/')) {
    const slug = extractSlugFromPath(pathname)
    if (slug) {
      tenantOrigins = await getAllowedOriginsForSlug(slug)
    }
  }

  if (shouldApplyProductionSecurityHeaders()) {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      buildContentSecurityPolicyReportOnly(pathname, tenantOrigins),
    )
    response.headers.set('Strict-Transport-Security', HSTS_HEADER_VALUE)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|workbox-|push-handler).*)'],
}
