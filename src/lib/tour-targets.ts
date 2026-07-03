/** Shared selectors for product tour spotlights (`data-tour` + `data-coach`). */

export const PRODUCT_TOUR_TARGETS = [
  'week-strip',
  'today-jobs',
  'fab',
  'nav-jobs',
  'nav-clients',
  'nav-reports',
  'header-pipeline',
  'profile-complete',
  'settings',
] as const

export type ProductTourTarget = (typeof PRODUCT_TOUR_TARGETS)[number]

export const COACH_TARGETS = [
  'jobs-search',
  'jobs-filters',
  'jobs-add',
  'clients-segments',
  'clients-list',
  'clients-add',
  'money-hero',
  'money-range',
  'money-export',
  'pipeline-stages',
  'pipeline-add',
  'pipeline-lead-menu',
  'invoices-search',
  'invoices-new',
  'tools-list',
  'tools-widget',
] as const

export type CoachTarget = (typeof COACH_TARGETS)[number]

export function tourSelector(target: ProductTourTarget): string {
  return `[data-tour="${target}"]`
}

export function coachSelector(target: CoachTarget | string): string {
  return `[data-coach="${target}"]`
}
