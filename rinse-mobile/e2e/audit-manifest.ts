export type AuditCaptureKind = 'route' | 'fab' | 'scroll'
export type AuditLane = 'operator' | 'funnel' | 'onboarding'

export interface AuditCapture {
  /** Baseline filename in screenshots/audit-2026-07-07/native/ */
  file: string
  kind: AuditCaptureKind
  /** Expo Router path (no base URL). */
  path?: string
  /** Looser diff for screens with dates, counts, or live data. */
  dynamic?: boolean
  /** Optional — resolved at runtime from PocketBase. */
  requiresEntity?: 'job' | 'client' | 'invoice'
  /** For scroll captures — pixels to scroll before screenshot. */
  scrollY?: number
  /** operator (default) = authed app shell; funnel = welcome/intro; onboarding = setup steps. */
  lane?: AuditLane
}

/** Screens captured in audit-2026-07-07 — keep in sync when adding routes. */
export const NATIVE_AUDIT_CAPTURES: AuditCapture[] = [
  { file: '01-home.png', kind: 'route', path: '/', dynamic: true },
  { file: '02-jobs.png', kind: 'route', path: '/jobs', dynamic: true },
  { file: '03-clients.png', kind: 'route', path: '/clients', dynamic: true },
  { file: '04-business.png', kind: 'route', path: '/reports', dynamic: true },
  { file: '05-pipeline.png', kind: 'route', path: '/pipeline', dynamic: true },
  { file: '06-messages.png', kind: 'route', path: '/messages', dynamic: true },
  { file: '07-invoices.png', kind: 'route', path: '/invoices', dynamic: true },
  { file: '08-inventory.png', kind: 'route', path: '/inventory' },
  { file: '09-quotes.png', kind: 'route', path: '/quotes', dynamic: true },
  { file: '10-tools.png', kind: 'route', path: '/tools' },
  { file: '11-settings.png', kind: 'route', path: '/settings' },
  { file: '12-job-detail.png', kind: 'route', path: '/jobs/__JOB_ID__', requiresEntity: 'job', dynamic: true },
  { file: '13-client-detail.png', kind: 'route', path: '/clients/__CLIENT_ID__', requiresEntity: 'client', dynamic: true },
  { file: '14-quick-actions.png', kind: 'fab', path: '/', dynamic: true },
  { file: '15-invoice-detail.png', kind: 'route', path: '/invoices/__INVOICE_ID__', requiresEntity: 'invoice', dynamic: true },
  { file: '16-settings-business.png', kind: 'route', path: '/settings/business' },
  { file: '04b-business-full.png', kind: 'scroll', path: '/settings/business', scrollY: 900 },
  { file: '17-welcome.png', kind: 'route', path: '/welcome', lane: 'funnel' },
  { file: '18-intro.png', kind: 'route', path: '/intro', dynamic: true, lane: 'funnel' },
  {
    file: '19-onboarding-business.png',
    kind: 'route',
    path: '/onboarding?step=business',
    dynamic: true,
    lane: 'onboarding',
  },
  {
    file: '20-onboarding-plans.png',
    kind: 'route',
    path: '/onboarding?step=plans',
    dynamic: true,
    lane: 'onboarding',
  },
]

export const OPERATOR_AUDIT_CAPTURES = NATIVE_AUDIT_CAPTURES.filter(
  (c) => !c.lane || c.lane === 'operator',
)
export const FUNNEL_AUDIT_CAPTURES = NATIVE_AUDIT_CAPTURES.filter((c) => c.lane === 'funnel')
export const ONBOARDING_AUDIT_CAPTURES = NATIVE_AUDIT_CAPTURES.filter((c) => c.lane === 'onboarding')

/** Cross-lane loose parity — native web vs PWA audit stills (high tolerance). */
export const PWA_PARITY_CAPTURES: { nativeFile: string; pwaFile: string; path: string; dynamic?: boolean }[] = [
  { nativeFile: '01-home.png', pwaFile: 'pwa-01-home.png', path: '/', dynamic: true },
  { nativeFile: '02-jobs.png', pwaFile: 'pwa-jobs.png', path: '/jobs', dynamic: true },
  { nativeFile: '03-clients.png', pwaFile: 'pwa-clients.png', path: '/clients', dynamic: true },
  { nativeFile: '04-business.png', pwaFile: 'pwa-04-business.png', path: '/reports', dynamic: true },
  { nativeFile: '11-settings.png', pwaFile: 'pwa-05-settings.png', path: '/settings' },
]
