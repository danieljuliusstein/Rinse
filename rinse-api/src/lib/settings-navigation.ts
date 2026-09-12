import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/** Parent route when leaving a settings screen (deterministic — avoids history traps). */
const SETTINGS_BACK_PARENT: Record<string, string> = {
  '/settings/account': '/settings',
  '/settings/business': '/settings',
  '/settings/invoicing': '/settings',
  '/settings/progress': '/',
  '/settings/schedule': '/settings',
  '/settings/preferences': '/settings',
  '/settings/access': '/settings',
  '/settings/expenses': '/settings',
  '/settings/support': '/settings',
  '/settings/faq': '/settings/support',
  '/settings/packages': '/settings',
  '/settings/overhead': '/settings/expenses',
  '/settings/business-expenses': '/settings/expenses',
}

/**
 * Where the settings back button should go for the current path.
 * Hub → home; detail → hub or nested parent (e.g. expenses → hub, overhead → expenses).
 */
export function getSettingsBackHref(pathname: string): string {
  if (pathname === '/settings') return '/'
  const mapped = SETTINGS_BACK_PARENT[pathname]
  if (mapped) return mapped
  if (pathname.startsWith('/settings/')) return '/settings'
  return '/'
}

/**
 * Navigate back within settings without pushing duplicate history entries.
 * Uses replace so hub ↔ detail cannot trap the browser back stack.
 */
export function navigateSettingsBack(router: AppRouterInstance, pathname: string) {
  router.replace(getSettingsBackHref(pathname))
}
