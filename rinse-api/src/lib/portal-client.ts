import { getAuthFetchHeaders } from './pb-auth'
import { handleApiResponsePremiumGate, PREMIUM_REQUIRED_MESSAGE } from './premium-api'
import { getCurrentOrganizationId } from './tenant'

export type PortalScope = 'job' | 'photos' | 'invoice' | 'quote' | 'full'

export interface CreatePortalLinkResult {
  url: string
  token: string
  expiresAt: string
}

/** Same-origin portal URLs should navigate in-app — `target="_blank"` opens two browsers in PWAs. */
export function sameOriginPortalPath(link: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = new URL(link, window.location.href)
    if (parsed.origin !== window.location.origin) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function openPortalLink(link: string, navigate: (path: string) => void): void {
  const path = sameOriginPortalPath(link)
  if (path) {
    navigate(path)
    return
  }
  window.open(link, '_blank', 'noopener,noreferrer')
}

export async function createShareLink(input: {
  clientId: string
  scope: PortalScope
  jobId?: string
  quoteId?: string
}): Promise<CreatePortalLinkResult> {
  const res = await fetch('/api/portal/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthFetchHeaders(),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    if (await handleApiResponsePremiumGate(res)) {
      throw new Error(PREMIUM_REQUIRED_MESSAGE)
    }
    const err = await res.json().catch(() => ({}))
    const raw = (err as { error?: string }).error
    if (res.status === 401) {
      throw new Error('Could not create link — sign in and try again')
    }
    if (raw?.includes("wasn't found") || raw?.includes('not found')) {
      throw new Error('Record not found — refresh the page and try again')
    }
    throw new Error(raw ?? `Failed to create link (${res.status})`)
  }

  return res.json()
}

export async function copyShareLink(url: string): Promise<void> {
  await navigator.clipboard.writeText(url)
}

export async function emailShareLink(input: {
  to: string
  clientName: string
  businessName: string
  portalUrl: string
  subject?: string
  message?: string
}): Promise<void> {
  const res = await fetch('/api/portal/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthFetchHeaders(),
    },
    body: JSON.stringify({
      ...input,
      organizationId: getCurrentOrganizationId(),
    }),
  })

  if (!res.ok) {
    if (await handleApiResponsePremiumGate(res)) {
      throw new Error(PREMIUM_REQUIRED_MESSAGE)
    }
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to send email')
  }
}
