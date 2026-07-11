/**
 * Marketing / waitlist screenshot shot list.
 *
 * - Operator UI: rinse-mobile (Expo web)
 * - Customer booking + portal: live rinsehq.com public pages (no PWA code changes)
 *
 * Product note: operators can create/send invoices and portal links on scheduled
 * jobs — clients can sign before the job starts. Portal capture should show that.
 */

export type MarketingCaptureKind = 'route' | 'fab'
export type MarketingLane = 'operator' | 'customer'

export interface MarketingCapture {
  /** Written to marketing/raw/screenshots/ */
  file: string
  kind: MarketingCaptureKind
  lane: MarketingLane
  /** Expo path for operator lane. */
  path?: string
  /**
   * Customer lane: absolute URL template.
   * Tokens: __BOOKING_URL__, __PORTAL_URL__
   */
  absoluteUrl?: string
  /** Prefer a job that has gallery photos when set. */
  requiresEntity?: 'job' | 'photoJob' | 'invoice' | 'booking' | 'portal'
  /** Playwright locator that should be visible before capture. */
  ready?: string
}

export const MARKETING_CAPTURES: MarketingCapture[] = [
  {
    file: '01-home.png',
    kind: 'route',
    lane: 'operator',
    path: '/',
    ready: 'text=/Today|This week|Jobs|Good /i',
  },
  {
    file: '02-jobs.png',
    kind: 'route',
    lane: 'operator',
    path: '/jobs',
    ready: 'text=/Jobs|Search/i',
  },
  {
    file: '04-job-photos.png',
    kind: 'route',
    lane: 'operator',
    path: '/jobs/__PHOTO_JOB_ID__/photos',
    requiresEntity: 'photoJob',
    ready: 'text=/Before|After|Photos/i',
  },
  {
    file: '08-booking-step1.png',
    kind: 'route',
    lane: 'customer',
    absoluteUrl: '__BOOKING_URL__',
    requiresEntity: 'booking',
    ready: '.book-package-card, text=/Select|Package|Book/i',
  },
  {
    file: '10-portal.png',
    kind: 'route',
    lane: 'customer',
    absoluteUrl: '__PORTAL_URL__',
    requiresEntity: 'portal',
    ready: '.portal-root, text=/Invoice|Sign|Pay|portal/i',
  },
  {
    file: '11-fab-menu.png',
    kind: 'fab',
    lane: 'operator',
    path: '/',
    ready: 'text=/Today|This week|Jobs/i',
  },
]

/** Hero + feature strip for waitlist export (order matters). */
export const WAITLIST_FEATURE_FILES = [
  '01-home.png',
  '02-jobs.png',
  '04-job-photos.png',
  '08-booking-step1.png',
  '10-portal.png',
] as const

export const WAITLIST_FEATURE_LABELS = ['home', 'jobs', 'photos', 'booking', 'portal'] as const
