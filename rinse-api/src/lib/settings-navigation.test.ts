import { describe, expect, it } from 'vitest'
import { getSettingsBackHref } from './settings-navigation'

describe('getSettingsBackHref', () => {
  it('returns home from settings hub', () => {
    expect(getSettingsBackHref('/settings')).toBe('/')
  })

  it('returns hub from top-level detail pages', () => {
    expect(getSettingsBackHref('/settings/account')).toBe('/settings')
    expect(getSettingsBackHref('/settings/business')).toBe('/settings')
    expect(getSettingsBackHref('/settings/access')).toBe('/settings')
    expect(getSettingsBackHref('/settings/progress')).toBe('/')
  })

  it('returns expenses hub from overhead pages', () => {
    expect(getSettingsBackHref('/settings/overhead')).toBe('/settings/expenses')
    expect(getSettingsBackHref('/settings/business-expenses')).toBe('/settings/expenses')
  })

  it('falls back to hub for unknown settings child routes', () => {
    expect(getSettingsBackHref('/settings/unknown')).toBe('/settings')
  })
})
