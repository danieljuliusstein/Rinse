import { describe, expect, it } from 'vitest'
import type { PortalScope } from './portal-tokens'
import {
  portalScopeAllowsCheckout,
  portalScopeAllowsPhotos,
  PORTAL_CHECKOUT_SCOPES,
  PORTAL_PHOTO_SCOPES,
} from './portal-scope'

const ALL_SCOPES: PortalScope[] = ['job', 'photos', 'invoice', 'quote', 'full']

describe('portalScopeAllowsCheckout', () => {
  it('allows invoice, full, and job scopes', () => {
    for (const scope of PORTAL_CHECKOUT_SCOPES) {
      expect(portalScopeAllowsCheckout(scope)).toBe(true)
    }
  })

  it('denies quote-only and photos-only scopes', () => {
    expect(portalScopeAllowsCheckout('quote')).toBe(false)
    expect(portalScopeAllowsCheckout('photos')).toBe(false)
  })

  it('covers every defined portal scope', () => {
    for (const scope of ALL_SCOPES) {
      const allowed = scope === 'invoice' || scope === 'full' || scope === 'job'
      expect(portalScopeAllowsCheckout(scope)).toBe(allowed)
    }
  })
})

describe('portalScopeAllowsPhotos', () => {
  it('allows photos, full, and job scopes', () => {
    for (const scope of PORTAL_PHOTO_SCOPES) {
      expect(portalScopeAllowsPhotos(scope)).toBe(true)
    }
  })

  it('denies invoice-only and quote-only scopes', () => {
    expect(portalScopeAllowsPhotos('invoice')).toBe(false)
    expect(portalScopeAllowsPhotos('quote')).toBe(false)
  })

  it('covers every defined portal scope', () => {
    for (const scope of ALL_SCOPES) {
      const allowed = scope === 'photos' || scope === 'full' || scope === 'job'
      expect(portalScopeAllowsPhotos(scope)).toBe(allowed)
    }
  })
})

/*
 * Manual QA (portal scope — Wave 4):
 * 1. Create quote-scoped link → open /api/portal/{token}/checkout → expect 403 (POST) or pay_error redirect (GET).
 * 2. Create photos-scoped link → same checkout URL → expect 403 / pay_error.
 * 3. Create invoice-scoped link → checkout succeeds when invoice has balance; photo URL returns 404.
 * 4. Create photos-scoped link → photo URL returns 200 when filename exists on job.
 * 5. Create job-scoped link → both checkout (with invoice) and photos work.
 */
