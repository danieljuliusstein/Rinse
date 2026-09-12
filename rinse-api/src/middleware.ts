import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  buildContentSecurityPolicyReportOnly,
  HSTS_HEADER_VALUE,
  shouldApplyProductionSecurityHeaders,
} from '@/lib/server/csp'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  if (!pathname.startsWith('/book/') && !pathname.startsWith('/embed/')) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  if (shouldApplyProductionSecurityHeaders()) {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      buildContentSecurityPolicyReportOnly(pathname),
    )
    response.headers.set('Strict-Transport-Security', HSTS_HEADER_VALUE)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|workbox-|push-handler).*)'],
}
