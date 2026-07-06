import type { PortalScope } from './portal-tokens'

/** Scopes that may start Stripe checkout (mirrors sign-invoice). */
export const PORTAL_CHECKOUT_SCOPES = ['invoice', 'full', 'job'] as const satisfies readonly PortalScope[]

/** Scopes that may stream job photos. */
export const PORTAL_PHOTO_SCOPES = ['photos', 'full', 'job'] as const satisfies readonly PortalScope[]

export function portalScopeAllowsCheckout(scope: PortalScope): boolean {
  return (PORTAL_CHECKOUT_SCOPES as readonly PortalScope[]).includes(scope)
}

export function portalScopeAllowsPhotos(scope: PortalScope): boolean {
  return (PORTAL_PHOTO_SCOPES as readonly PortalScope[]).includes(scope)
}
