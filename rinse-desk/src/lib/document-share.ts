import { appApiDownloadPdf, appApiJson, AppApiError } from './app-api'
import { getAppApiUrl } from './pocketbase'
import { assertPremiumAccess } from './subscription'
import type { DeskInvoice, DeskQuote } from './types'

export type PortalScope = 'job' | 'photos' | 'invoice' | 'quote' | 'full'

export type PortalLinkResult = {
  url: string
  token: string
  expiresAt: string
}

export function isAppApiConfigured(): boolean {
  return Boolean(getAppApiUrl().trim())
}

export function assertAppApiConfigured(): void {
  if (!isAppApiConfigured()) {
    throw new AppApiError(
      'Set VITE_APP_API_URL in rinse-desk/.env.local (e.g. https://rinsehq.com) and restart Vite.',
      0,
    )
  }
}

export function isValidContactEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function beforeShare(feature: string): Promise<void> {
  assertAppApiConfigured()
  await assertPremiumAccess(feature)
}

export async function createPortalLink(input: {
  clientId: string
  scope: PortalScope
  jobId?: string
  quoteId?: string
}): Promise<PortalLinkResult> {
  await beforeShare('client portal links')
  return appApiJson<PortalLinkResult>('/api/portal/create', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

export async function downloadInvoicePdf(
  inv: DeskInvoice,
  portalUrl?: string,
): Promise<void> {
  await beforeShare('PDF export')
  if (!inv.job_id) throw new Error('This invoice has no linked job')
  await appApiDownloadPdf(
    '/api/pdf/invoice',
    { jobId: inv.job_id, invoiceId: inv.id, portalUrl },
    `${inv.invoice_number || 'invoice'}.pdf`,
  )
}

export async function downloadQuotePdf(quote: DeskQuote): Promise<void> {
  await beforeShare('PDF export')
  await appApiDownloadPdf(
    '/api/pdf/quote',
    { quoteId: quote.id },
    `${quote.quote_number || 'quote'}.pdf`,
  )
}

export async function emailPortalLink(input: {
  to: string
  clientName: string
  businessName: string
  portalUrl: string
  subject?: string
  message?: string
  clientId?: string
}): Promise<void> {
  await beforeShare('emailing portal links')
  await appApiJson('/api/portal/send', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Prefer Resend portal/send; fall back to mailto if API unavailable. */
export async function sendDocumentLink(opts: {
  to: string
  clientName: string
  businessName: string
  portalUrl: string
  subject: string
  message: string
  clientId?: string
}): Promise<'api' | 'mailto'> {
  if (!isValidContactEmail(opts.to)) {
    throw new Error('Enter a valid email address')
  }
  try {
    await emailPortalLink(opts)
    return 'api'
  } catch (err) {
    // Don't mailto-fallback on premium / auth / config — operator needs to fix those.
    if (err instanceof AppApiError && (err.status === 402 || err.status === 401 || err.status === 0)) {
      throw err
    }
    const mailto = `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(opts.subject)}&body=${encodeURIComponent(`${opts.message}\n\n${opts.portalUrl}`)}`
    window.location.href = mailto
    return 'mailto'
  }
}

export function shareErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AppApiError) return err.message
  if (err instanceof Error) return err.message
  return fallback
}
