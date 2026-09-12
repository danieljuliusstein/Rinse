import { describe, expect, it } from 'vitest'
import { countMatchingSettingsSections, matchesSettingsSearch, searchSettings } from './settings-search'

describe('settings search', () => {
  it('matches empty query to everything', () => {
    expect(matchesSettingsSearch('', ['Your business', 'logo'])).toBe(true)
  })

  it('matches multi-word queries when all tokens appear', () => {
    expect(matchesSettingsSearch('business logo', ['Your business', 'logo', 'brand'])).toBe(true)
  })

  it('matches partial tokens', () => {
    expect(matchesSettingsSearch('notif', ['App preferences', 'notification'])).toBe(true)
  })

  it('finds business section by company or logo', () => {
    expect(countMatchingSettingsSections('logo')).toBeGreaterThan(0)
    expect(countMatchingSettingsSections('company')).toBeGreaterThan(0)
  })

  it('ranks exact title matches ahead of keyword-only matches', () => {
    const results = searchSettings('invoicing')
    expect(results[0]?.title).toBe('Invoicing')
  })

  it('finds pipeline via shortcut when user searches leads', () => {
    const results = searchSettings('leads')
    expect(results.some((r) => r.title === 'Lead pipeline')).toBe(true)
  })

  it('finds messages for auto reminder queries', () => {
    const results = searchSettings('auto reminder')
    expect(results.some((r) => r.href === '/messages')).toBe(true)
  })

  it('finds stripe connect under invoicing', () => {
    const results = searchSettings('stripe payments')
    expect(results.some((r) => r.href === '/settings/invoicing')).toBe(true)
  })

  it('falls back to similar matches when only some words match', () => {
    const results = searchSettings('qwerty stripe')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.similar)).toBe(true)
  })

  it('tolerates minor typos on single-word queries', () => {
    expect(searchSettings('billng').length).toBeGreaterThan(0)
  })

  it('returns no results for unrelated queries', () => {
    expect(searchSettings('zzzznotfoundxyz')).toHaveLength(0)
  })

  it('includes FAQ entries for help topics', () => {
    const results = searchSettings('booking hours')
    expect(results.some((r) => r.kind === 'faq' && r.href.includes('#schedule'))).toBe(true)
  })
})
