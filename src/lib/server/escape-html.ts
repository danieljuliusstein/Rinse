/** Escape user-controlled strings before HTML email interpolation (Security Wave 6). */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Strip characters unsafe in plain-text email headers (subject). */
export function sanitizeEmailSubject(text: string): string {
  return text.replace(/[\r\n<>]/g, ' ').trim()
}

const PORTAL_PATH_RE = /^\/portal\/[A-Za-z0-9_-]{16,}$/

/** Accept only same-origin portal links before using in href attributes. */
export function validatePortalEmailHref(portalUrl: string, allowedOrigins: string[]): string | null {
  let parsed: URL
  try {
    parsed = new URL(portalUrl)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (!allowedOrigins.includes(parsed.origin)) return null
  if (!PORTAL_PATH_RE.test(parsed.pathname)) return null

  return parsed.href
}
