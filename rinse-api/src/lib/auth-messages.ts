/** User-facing copy when PocketBase is not configured (client + server). */
export const AUTH_PB_NOT_CONFIGURED =
  'Sign-up and login need the Rinse backend. For local dev, start PocketBase and set NEXT_PUBLIC_PB_URL in .env.local (see pocketbase/README.md).'

export const AUTH_PB_ADMIN_NOT_CONFIGURED =
  'Sign-up server is missing admin credentials. Add PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD to .env.local, then restart the dev server.'

export const AUTH_OAUTH_UNAVAILABLE =
  'Google and Apple sign-in aren’t available right now. Use your email instead.'

/** Prefer PocketBase field validation messages over the generic ClientResponseError text. */
export function extractPocketBaseError(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  const e = err as {
    message?: string
    data?: { message?: string; data?: Record<string, { message?: string; code?: string }> }
    response?: { message?: string; data?: Record<string, { message?: string }> }
  }
  const fieldMap = e.data?.data ?? e.response?.data
  if (fieldMap && typeof fieldMap === 'object') {
    const parts = Object.entries(fieldMap)
      .map(([key, val]) => {
        const msg = val && typeof val === 'object' ? val.message : undefined
        return msg ? `${key}: ${msg}` : null
      })
      .filter(Boolean)
    if (parts.length) return parts.join('; ')
  }
  const nested = e.data?.message ?? e.response?.message
  if (nested && nested !== 'Something went wrong while processing your request.') return nested
  if (e.message && e.message !== 'Something went wrong while processing your request.') return e.message
  return fallback
}

/** Map internal PocketBase / signup errors to operator-friendly copy. */
export function formatAuthApiError(message: string): string {
  if (!message.trim()) return 'Something went wrong. Try again.'
  if (message === 'PocketBase URL not configured' || message.includes('PocketBase URL not configured')) {
    return AUTH_PB_NOT_CONFIGURED
  }
  if (message.includes('PocketBase admin not configured') || message.includes('PB_ADMIN_EMAIL')) {
    return AUTH_PB_ADMIN_NOT_CONFIGURED
  }
  if (message === 'Cloud login is not configured') {
    return AUTH_OAUTH_UNAVAILABLE
  }
  return message
}
