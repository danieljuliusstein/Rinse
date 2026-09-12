import { readFileSync } from 'fs'
import { join } from 'path'
import { hasCustomBusinessLogo } from './business-logo'
import { streamBusinessLogo } from './server/portal-data'

const DEFAULT_LOGO_PATH = join(process.cwd(), 'public', 'logo.png')

function slugFromLogoUrl(logoUrl?: string | null): string | undefined {
  if (!logoUrl?.includes('/api/business-logo')) return undefined
  try {
    const parsed = logoUrl.startsWith('http')
      ? new URL(logoUrl)
      : new URL(logoUrl, 'http://localhost')
    const slug = parsed.searchParams.get('slug')?.trim()
    return slug || undefined
  } catch {
    return undefined
  }
}

/** Resolve business logo to a data URI for @react-pdf/renderer. Null when no custom logo uploaded. */
export async function resolveInvoiceLogoDataUri(logoUrl?: string | null): Promise<string | null> {
  if (!hasCustomBusinessLogo(logoUrl)) return null

  const slug = slugFromLogoUrl(logoUrl)
  if (logoUrl?.includes('/api/business-logo') || logoUrl?.includes('/api/portal/business-logo')) {
    const streamed = await streamBusinessLogo(slug)
    if (streamed) {
      const buf = Buffer.from(streamed.bytes)
      return `data:${streamed.contentType};base64,${buf.toString('base64')}`
    }
  }

  if (logoUrl?.trim()) {
    try {
      const res = await fetch(logoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const contentType = res.headers.get('content-type')?.split(';')[0] || 'image/png'
        return `data:${contentType};base64,${buf.toString('base64')}`
      }
    } catch {
      return null
    }
  }

  return null
}

/** Legacy fallback — app mark only (avoid on customer-facing invoices). */
export async function resolveDefaultAppLogoDataUri(): Promise<string> {
  const buf = readFileSync(DEFAULT_LOGO_PATH)
  return `data:image/png;base64,${buf.toString('base64')}`
}
