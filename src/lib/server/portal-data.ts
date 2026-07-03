import { pocketBaseLogoFilename } from '../business-logo'
import { authenticateServerAdmin } from './pocketbase-admin'
import type { PortalScope, PortalTokenRecord } from './portal-tokens'

export interface PortalPhoto {
  filename: string
  type: 'before' | 'after'
  url: string
}

export interface PortalPayload {
  scope: PortalScope
  business: {
    name: string
    phone: string
    email: string
    address: string
    logoUrl?: string
    termsFooter?: string
    accentColor?: string | null
  }
  client: { name: string }
  job?: {
    id: string
    date: string
    vehicleType: string
    locationType: string
    packageName: string
    revenue: number
    tip: number
    status: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
    subtotal: number
    tip: number
    total: number
    amountPaid: number
    balanceDue: number
    status: string
    signatureUrl?: string
    signedAt?: string
  }
  quote?: {
    id: string
    quoteNumber: string
    subtotal: number
    date: string
    validUntil?: string
    status: string
    packageName: string
    vehicleType: string
    notes?: string
  }
  photos: PortalPhoto[]
}

export async function loadPortalBusiness(appBaseUrl: string, organizationId: string, slug?: string): Promise<PortalPayload['business']> {
  const pb = await authenticateServerAdmin()
  return loadSettingsForOrg(pb, appBaseUrl, organizationId, slug)
}

async function loadSettingsForOrg(
  pb: Awaited<ReturnType<typeof authenticateServerAdmin>>,
  appBaseUrl: string,
  organizationId: string,
  slug?: string
) {
  const orgEsc = organizationId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const records = await pb.collection('app_settings').getFullList({
    filter: `organization_id = "${orgEsc}"`,
    limit: 1,
  })
  const s = records[0]
  const base = appBaseUrl.replace(/\/$/, '')
  const logoQuery = slug ? `?slug=${encodeURIComponent(slug)}` : ''

  if (!s) {
    return {
      name: 'Detailing',
      phone: '',
      email: '',
      address: '',
      logoUrl: `${base}/api/business-logo${logoQuery}`,
      termsFooter: undefined as string | undefined,
    }
  }

  const logoUrl = `${base}/api/business-logo${logoQuery}`

  return {
    name: String(s.business_name ?? 'Detailing'),
    phone: String(s.business_phone ?? ''),
    email: String(s.business_email ?? ''),
    address: String(s.business_address ?? ''),
    logoUrl,
    termsFooter: String(s.invoice_terms_footer ?? ''),
    accentColor: s.accent_color ? String(s.accent_color) : null,
  }
}

export async function buildPortalPayload(
  tokenRecord: PortalTokenRecord,
  appBaseUrl: string
): Promise<PortalPayload | null> {
  const pb = await authenticateServerAdmin()

  let clientName = 'Client'
  let organizationId = tokenRecord.organization_id ?? ''
  let orgSlug = ''
  try {
    const client = await pb.collection('clients').getOne(tokenRecord.client_id)
    clientName = String(client.name ?? 'Client')
    if (!organizationId) {
      organizationId = String(client.organization_id ?? '')
    }
    if (organizationId) {
      try {
        const org = await pb.collection('organizations').getOne(organizationId)
        orgSlug = String(org.slug ?? '')
      } catch {
        // ignore
      }
    }
  } catch {
    return null
  }

  if (!organizationId) return null
  const business = await loadSettingsForOrg(pb, appBaseUrl, organizationId, orgSlug)
  const scope = tokenRecord.scope

  const payload: PortalPayload = {
    scope,
    business,
    client: { name: clientName },
    photos: [],
  }

  if (tokenRecord.quote_id && (scope === 'quote' || scope === 'full')) {
    try {
      const quote = await pb.collection('quotes').getOne(tokenRecord.quote_id, {
        expand: 'package_id',
      })
      const pkg = quote.expand?.package_id
      payload.quote = {
        id: quote.id,
        quoteNumber: String(quote.quote_number),
        subtotal: Number(quote.subtotal),
        date: String(quote.date),
        validUntil: quote.valid_until ? String(quote.valid_until) : undefined,
        status: String(quote.status),
        packageName: pkg ? String(pkg.name) : '—',
        vehicleType: String(quote.vehicle_type),
        notes: quote.notes ? String(quote.notes) : undefined,
      }
    } catch {
      // quote optional
    }
  }

  if (tokenRecord.job_id) {
    try {
      const job = await pb.collection('jobs').getOne(tokenRecord.job_id, {
        expand: 'package_id,invoice_id',
      })
      const pkg = job.expand?.package_id

      if (scope !== 'quote') {
        payload.job = {
          id: job.id,
          date: String(job.date),
          vehicleType: String(job.vehicle_type),
          locationType: String(job.location_type),
          packageName: pkg ? String(pkg.name) : '—',
          revenue: Number(job.revenue),
          tip: Number(job.tip ?? 0),
          status: String(job.status),
        }
      }

      if ((scope === 'invoice' || scope === 'full' || scope === 'job') && job.expand?.invoice_id) {
        const inv = job.expand.invoice_id
        payload.invoice = {
          id: String(inv.id),
          invoiceNumber: String(inv.invoice_number),
          subtotal: Number(inv.subtotal),
          tip: Number(inv.tip ?? 0),
          total: Number(inv.total),
          amountPaid: Number(inv.amount_paid ?? 0),
          balanceDue: Number(inv.balance_due ?? 0),
          status: String(inv.status),
          signatureUrl: inv.signature_url ? String(inv.signature_url) : undefined,
          signedAt: inv.signed_at ? String(inv.signed_at) : undefined,
        }
      } else if (job.invoice_id && (scope === 'invoice' || scope === 'full')) {
        const inv = await pb.collection('invoices').getOne(String(job.invoice_id))
        payload.invoice = {
          id: String(inv.id),
          invoiceNumber: String(inv.invoice_number),
          subtotal: Number(inv.subtotal),
          tip: Number(inv.tip ?? 0),
          total: Number(inv.total),
          amountPaid: Number(inv.amount_paid ?? 0),
          balanceDue: Number(inv.balance_due ?? 0),
          status: String(inv.status),
          signatureUrl: inv.signature_url ? String(inv.signature_url) : undefined,
          signedAt: inv.signed_at ? String(inv.signed_at) : undefined,
        }
      }

      if (scope === 'photos' || scope === 'full' || scope === 'job') {
        const filenames = Array.isArray(job.photos) ? (job.photos as string[]) : []
        const meta = Array.isArray(job.photo_meta) ? (job.photo_meta as { filename: string; type: string }[]) : []
        payload.photos = filenames.map((filename) => {
          const entry = meta.find((m) => m.filename === filename)
          return {
            filename,
            type: (entry?.type === 'before' ? 'before' : 'after') as 'before' | 'after',
            url: `${appBaseUrl}/api/portal/${tokenRecord.token}/photo/${encodeURIComponent(filename)}`,
          }
        })
      }
    } catch {
      if (!tokenRecord.quote_id) return null
    }
  }

  return payload
}

export async function streamPortalPhoto(
  token: string,
  filename: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const { validatePortalToken } = await import('./portal-tokens')
  const record = await validatePortalToken(token)
  if (!record?.job_id) return null

  const pb = await authenticateServerAdmin()
  const job = await pb.collection('jobs').getOne(record.job_id)
  const photos = Array.isArray(job.photos) ? (job.photos as string[]) : []
  if (!photos.includes(filename)) return null

  const url = pb.files.getURL(job, filename)
  const res = await fetch(url, {
    headers: { Authorization: pb.authStore.token },
  })
  if (!res.ok) return null

  const bytes = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  return { bytes, contentType }
}

export async function streamBusinessLogo(slug?: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const pb = await authenticateServerAdmin()
    let records: Record<string, unknown>[] = []

    if (slug) {
      const { getOrganizationBySlug } = await import('./organization')
      const org = await getOrganizationBySlug(slug)
      if (org) {
        const orgEsc = org.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        records = await pb.collection('app_settings').getFullList({
          filter: `organization_id = "${orgEsc}"`,
          limit: 1,
        })
      }
    } else {
      records = await pb.collection('app_settings').getFullList({ limit: 1 })
    }

    const s = records[0]
    const logoFilename = pocketBaseLogoFilename(s?.logo)

    if (s && logoFilename) {
      const url = pb.files.getURL(s, logoFilename)
      const res = await fetch(url, {
        headers: { Authorization: pb.authStore.token },
      })
      if (res.ok) {
        const bytes = await res.arrayBuffer()
        const contentType = res.headers.get('content-type')?.split(';')[0] ?? 'image/png'
        return { bytes, contentType }
      }
    }
  } catch {
    // fall through to bundled default
  }

  try {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const buf = readFileSync(join(process.cwd(), 'public', 'logo.png'))
    return { bytes: Uint8Array.from(buf).buffer, contentType: 'image/png' }
  } catch {
    return null
  }
}
