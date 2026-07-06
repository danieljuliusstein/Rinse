import { describe, expect, it } from 'vitest'
import {
  ADMIN_AUTH,
  ADMIN_HOME,
  isAdminAllowedPath,
  isDemoPath,
  isOperatorPath,
  isPublicClientPath,
  parseAdminViewParam,
  resolveGuestRedirect,
  resolveLogoutHref,
  resolvePostAuthHome,
} from './route-lanes'

describe('route-lanes', () => {
  it('identifies public client paths', () => {
    expect(isPublicClientPath('/book/summit-detail')).toBe(true)
    expect(isPublicClientPath('/embed/book/summit-detail')).toBe(true)
    expect(isPublicClientPath('/portal/abc')).toBe(true)
    expect(isPublicClientPath('/jobs')).toBe(false)
  })

  it('identifies demo paths', () => {
    expect(isDemoPath('/demo')).toBe(true)
    expect(isDemoPath('/demo/admin-dashboard')).toBe(true)
    expect(isDemoPath('/admin')).toBe(false)
  })

  it('allows admin lane paths', () => {
    expect(isAdminAllowedPath('/admin')).toBe(true)
    expect(isAdminAllowedPath(ADMIN_AUTH)).toBe(true)
    expect(isAdminAllowedPath('/auth/reset')).toBe(true)
    expect(isAdminAllowedPath('/privacy')).toBe(true)
    expect(isAdminAllowedPath('/terms')).toBe(true)
    expect(isAdminAllowedPath('/terms/customers')).toBe(true)
    expect(isAdminAllowedPath('/offline')).toBe(true)
    expect(isAdminAllowedPath('/book/acme')).toBe(true)
    expect(isAdminAllowedPath('/demo/home')).toBe(true)
  })

  it('treats operator paths as not admin-allowed', () => {
    expect(isAdminAllowedPath('/')).toBe(false)
    expect(isAdminAllowedPath('/jobs')).toBe(false)
    expect(isAdminAllowedPath('/settings')).toBe(false)
    expect(isAdminAllowedPath('/settings/account')).toBe(false)
    expect(isAdminAllowedPath('/auth')).toBe(false)
  })

  it('isOperatorPath is inverse of admin-allowed for app routes', () => {
    expect(isOperatorPath('/jobs')).toBe(true)
    expect(isOperatorPath('/admin')).toBe(false)
    expect(isOperatorPath('/book/x')).toBe(false)
    expect(isOperatorPath('/welcome')).toBe(false)
    expect(isOperatorPath('/auth')).toBe(false)
  })

  it('resolvePostAuthHome and resolveLogoutHref', () => {
    expect(resolvePostAuthHome(true)).toBe(ADMIN_HOME)
    expect(resolvePostAuthHome(false)).toBe('/')
    expect(resolveLogoutHref(true)).toBe(ADMIN_AUTH)
    expect(resolveLogoutHref(false)).toBe('/welcome')
  })

  it('resolveGuestRedirect sends /admin guests to admin auth', () => {
    expect(resolveGuestRedirect('/admin')).toBe(ADMIN_AUTH)
    expect(resolveGuestRedirect('/jobs')).toBeNull()
  })

  it('parseAdminViewParam', () => {
    expect(parseAdminViewParam('orgs')).toBe('orgs')
    expect(parseAdminViewParam('account')).toBe('account')
    expect(parseAdminViewParam('invalid')).toBeNull()
    expect(parseAdminViewParam(null)).toBeNull()
  })
})
