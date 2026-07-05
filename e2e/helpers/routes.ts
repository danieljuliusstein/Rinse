import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export interface DemoIds {
  paidJobId?: string
  photoJobId?: string
  inProgressJobId?: string
  clientMarcusId?: string
  clientSarahId?: string
  clientId?: string
  sentInvoiceId?: string
  paidInvoiceId?: string
  fullDetailPackageId?: string
  quoteId?: string
  vehicleId?: string
  damageId?: string
}

export interface DemoManifest {
  orgSlug: string
  orgId?: string
  ids?: DemoIds
  routes: Record<string, string | null>
}

const SETTINGS_PAGES = [
  '/settings',
  '/settings/business',
  '/settings/packages',
  '/settings/schedule',
  '/settings/invoicing',
  '/settings/billing',
  '/settings/account',
  '/settings/preferences',
  '/settings/support',
  '/settings/faq',
  '/settings/expenses',
  '/settings/business-expenses',
  '/settings/overhead',
  '/settings/access',
  '/settings/progress',
] as const

export function loadDemoManifest(): DemoManifest {
  const manifestPath = join(process.cwd(), 'marketing', 'demo-manifest.json')
  if (!existsSync(manifestPath)) {
    return {
      orgSlug: 'summit-detail',
      routes: {
        home: '/',
        jobs: '/jobs',
        jobDetail: '/jobs/demo-job',
        client: '/clients/demo-client',
        reports: '/reports',
        pipeline: '/pipeline',
        booking: '/book/summit-detail',
      },
    }
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as DemoManifest
}

export function staticPublicRoutes(manifest: DemoManifest): string[] {
  const routes = new Set<string>([
    '/welcome',
    '/intro',
    '/auth',
    '/auth/reset',
    '/auth/oauth/callback',
    '/privacy',
    '/offline',
    `/book/${manifest.orgSlug}`,
  ])

  const bookingDeep = manifest.routes.bookingDeep
  if (bookingDeep) routes.add(bookingDeep)

  return [...routes]
}

/** @deprecated Use staticPublicRoutes */
export function publicSmokeRoutes(manifest: DemoManifest): string[] {
  return staticPublicRoutes(manifest)
}

export function demoRoutes(): string[] {
  return ['/demo', '/demo/home', '/demo/jobs', '/demo/invoice', '/demo/booking']
}

export function embedRoutes(manifest: DemoManifest): string[] {
  return [`/embed/book/${manifest.orgSlug}`]
}

export function operatorCreateRoutes(): string[] {
  return ['/jobs/new', '/clients/new', '/invoices/new', '/quotes/new']
}

export function operatorMiscRoutes(): string[] {
  return ['/admin', '/onboarding?step=business']
}

export function operatorDynamicRoutes(ids: DemoIds, manifest: DemoManifest): string[] {
  const routes = new Set<string>()
  const clientId = ids.clientMarcusId || ids.clientId

  if (ids.paidJobId) {
    routes.add(`/jobs/${ids.paidJobId}/edit`)
    routes.add(`/jobs/${ids.paidJobId}/invoice`)
  }
  if (ids.inProgressJobId) routes.add(`/jobs/${ids.inProgressJobId}`)
  if (ids.photoJobId) routes.add(`/jobs/${ids.photoJobId}/photos`)

  if (clientId) {
    routes.add(`/clients/${clientId}/edit`)
    routes.add(`/clients/${clientId}/vehicles/new`)
    if (ids.vehicleId) {
      routes.add(`/clients/${clientId}/vehicles/${ids.vehicleId}`)
      routes.add(`/clients/${clientId}/vehicles/${ids.vehicleId}/edit`)
      routes.add(`/clients/${clientId}/vehicles/${ids.vehicleId}/damage/new`)
      if (ids.damageId) {
        routes.add(`/clients/${clientId}/vehicles/${ids.vehicleId}/damage/${ids.damageId}`)
      }
    }
  }

  if (ids.quoteId) routes.add(`/quotes/${ids.quoteId}`)

  for (const value of Object.values(manifest.routes)) {
    if (!value || !value.startsWith('/')) continue
    if (value.startsWith('/book/') || value.startsWith('/portal/') || value.startsWith('/embed/')) continue
    routes.add(value.split('?')[0]!)
  }

  return [...routes].sort()
}

export function operatorSmokeRoutes(manifest: DemoManifest, ids: DemoIds = manifest.ids ?? {}): string[] {
  const routes = new Set<string>([
    '/',
    '/jobs',
    '/clients',
    '/reports',
    '/pipeline',
    '/tools',
    '/messages',
    '/quotes',
    '/invoices',
    '/inventory',
    ...SETTINGS_PAGES,
    ...operatorCreateRoutes(),
    ...operatorMiscRoutes(),
    ...operatorDynamicRoutes(ids, manifest),
  ])

  return [...routes].sort()
}
