export const ADMIN_HOME = '/admin'
export const ADMIN_AUTH = '/auth/admin'
export const OPERATOR_HOME = '/'

export type AdminViewParam = 'overview' | 'orgs' | 'backups' | 'system' | 'audit' | 'account'

const ADMIN_VIEW_PARAMS = new Set<AdminViewParam>([
  'overview',
  'orgs',
  'backups',
  'system',
  'audit',
  'account',
])

export function isPublicClientPath(pathname: string): boolean {
  return (
    pathname.startsWith('/book/') ||
    pathname.startsWith('/embed/') ||
    pathname.startsWith('/portal')
  )
}

export function isDemoPath(pathname: string): boolean {
  return pathname === '/demo' || pathname.startsWith('/demo/')
}

export function isAuthFlowPath(pathname: string): boolean {
  return (
    pathname === '/auth' ||
    pathname === ADMIN_AUTH ||
    pathname === '/auth/reset' ||
    pathname.startsWith('/auth/oauth/')
  )
}

export function isAdminAllowedPath(pathname: string): boolean {
  if (pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`)) return true
  if (pathname === ADMIN_AUTH) return true
  if (pathname === '/auth/reset') return true
  if (pathname === '/privacy' || pathname === '/offline') return true
  if (isPublicClientPath(pathname)) return true
  if (isDemoPath(pathname)) return true
  return false
}

export function isOperatorPath(pathname: string): boolean {
  if (isAdminAllowedPath(pathname)) return false
  if (isAuthFlowPath(pathname)) return false
  if (pathname === '/welcome' || pathname === '/intro' || pathname === '/onboarding') return false
  return true
}

export function resolvePostAuthHome(isPlatformAdmin: boolean): string {
  return isPlatformAdmin ? ADMIN_HOME : OPERATOR_HOME
}

export function resolveLogoutHref(isPlatformAdmin: boolean): string {
  return isPlatformAdmin ? ADMIN_AUTH : '/welcome'
}

export function resolveGuestRedirect(pathname: string): string | null {
  if (pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`)) {
    return ADMIN_AUTH
  }
  return null
}

export function parseAdminViewParam(value: string | null | undefined): AdminViewParam | null {
  if (!value) return null
  return ADMIN_VIEW_PARAMS.has(value as AdminViewParam) ? (value as AdminViewParam) : null
}
