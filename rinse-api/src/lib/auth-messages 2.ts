/** User-facing copy when PocketBase is not configured (client + server). */
export const AUTH_PB_NOT_CONFIGURED =
  'Sign-up and login need the Rinse backend. For local dev, start PocketBase and set NEXT_PUBLIC_PB_URL in .env.local (see pocketbase/README.md).'

export const AUTH_PB_ADMIN_NOT_CONFIGURED =
  'Sign-up server is missing admin credentials. Add PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD to .env.local, then restart the dev server.'

export const AUTH_OAUTH_UNAVAILABLE =
  'Google and Apple sign-in aren’t available right now. Use your email instead.'

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
