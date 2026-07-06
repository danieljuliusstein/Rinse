/** Security Wave 5 — Content-Security-Policy-Report-Only builder (not enforcing yet). */

export const CSP_REPORT_PATH = '/api/csp-report'

export const HSTS_HEADER_VALUE = 'max-age=63072000; includeSubDomains; preload'

export function pocketBaseOrigin(): string | null {
  const raw = process.env.PB_URL ?? process.env.NEXT_PUBLIC_PB_URL
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

/** frame-ancestors for /book/* and /embed/* — customer sites that iframe the widget. */
export function embedFrameAncestors(): string {
  const ancestors = ["'self'"]
  const raw = process.env.BOOKING_ALLOWED_ORIGINS?.trim()
  if (raw) {
    for (const origin of raw.split(',')) {
      const trimmed = origin.trim()
      if (trimmed) ancestors.push(trimmed)
    }
  }
  // TODO: add each customer marketing-site origin (e.g. https://customer-wordpress.com) when known.
  return ancestors.join(' ')
}

export function buildContentSecurityPolicyReportOnly(pathname: string): string {
  const pb = pocketBaseOrigin()
  const isEmbedRoute = pathname.startsWith('/book/') || pathname.startsWith('/embed/')
  const frameAncestors = isEmbedRoute ? embedFrameAncestors() : "'self'"

  const connectSrc = [
    "'self'",
    'https://api.stripe.com',
    'https://errors.stripe.com',
    'https://q.stripe.com',
    'https://m.stripe.network',
    ...(pb ? [pb] : []),
  ].join(' ')

  const imgSrc = ["'self'", 'data:', 'https://*.stripe.com', ...(pb ? [pb] : [])].join(' ')

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
    `connect-src ${connectSrc} https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    'frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com',
    `img-src ${imgSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `frame-ancestors ${frameAncestors}`,
    `report-uri ${CSP_REPORT_PATH}`,
  ]

  return directives.join('; ')
}

export function shouldApplyProductionSecurityHeaders(): boolean {
  return process.env.NODE_ENV === 'production'
}
