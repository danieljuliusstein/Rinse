/**
 * Unique open/click gating: only the first event should bump campaign stats.
 * Pure helper for unit/smoke clarity.
 */
export function shouldIncrementOpen(openedAt: string | null | undefined): boolean {
  return !openedAt || !String(openedAt).trim()
}

/** Same empty-gate semantics as opens, for `clicked_at`. */
export function shouldIncrementClick(clickedAt: string | null | undefined): boolean {
  return shouldIncrementOpen(clickedAt)
}

export type OpenWebhookData = {
  email_id?: string
  created_at?: string
  /** Present on some `email.clicked` payloads (destination URL). */
  link?: string
  click?: { link?: string }
}

export function extractEmailId(data: OpenWebhookData | null | undefined): string | null {
  const id = data?.email_id?.trim()
  return id || null
}
