import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APP_DISPLAY_NAME,
  DEFAULT_APP_VERSION,
  SUPPORT_FAQ,
  buildBugReportMailto,
  buildBillingMailto,
  buildContactMailto,
  buildDebugInfo,
  buildPrivacyMailto,
  buildSupportMailto,
  getAppVersion,
  getBillingEmail,
  getPrivacyEmail,
  getSupportEmail,
} from './support-config'

describe('support-config', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', '')
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('FAQ has stable unique ids', () => {
    expect(SUPPORT_FAQ.length).toBeGreaterThan(0)
    const ids = SUPPORT_FAQ.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of SUPPORT_FAQ) {
      expect(item.question.trim()).not.toBe('')
      expect(item.answer.trim()).not.toBe('')
    }
  })

  it('getAppVersion falls back to default', () => {
    expect(getAppVersion()).toBe(DEFAULT_APP_VERSION)
  })

  it('getAppVersion uses env when set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.3')
    expect(getAppVersion()).toBe('1.2.3')
  })

  it('getSupportEmail returns null when unset or invalid', () => {
    expect(getSupportEmail()).toBeNull()
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'not-an-email')
    expect(getSupportEmail()).toBeNull()
  })

  it('getSupportEmail returns trimmed email', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', '  help@example.com  ')
    expect(getSupportEmail()).toBe('help@example.com')
  })

  it('buildDebugInfo includes core fields', () => {
    const text = buildDebugInfo({
      backend: 'pocketbase',
      origin: 'https://app.example.com',
      userAgent: 'TestAgent/1.0',
      timestamp: '2026-06-25T12:00:00.000Z',
      orgSlug: 'atlas',
      businessName: 'Rinse',
    })
    expect(text).toContain(APP_DISPLAY_NAME)
    expect(text).toContain(`Version: ${DEFAULT_APP_VERSION}`)
    expect(text).toContain('Backend: pocketbase')
    expect(text).toContain('Origin: https://app.example.com')
    expect(text).toContain('Org slug: atlas')
    expect(text).toContain('Business: Rinse')
    expect(text).toContain('User agent: TestAgent/1.0')
  })

  it('buildSupportMailto returns null without email', () => {
    expect(buildSupportMailto({ subject: 'Hi' })).toBeNull()
    expect(buildContactMailto()).toBeNull()
    expect(buildBugReportMailto('debug')).toBeNull()
  })

  it('buildSupportMailto encodes subject and body', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@example.com')
    const url = buildSupportMailto({
      subject: 'Rinse support request',
      body: 'line1\nline2',
    })
    expect(url).toMatch(/^mailto:support@example.com\?/)
    expect(url).toContain('subject=')
    expect(url).toContain('body=')
  })

  it('buildContactMailto uses app display name in subject', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@example.com')
    const url = buildContactMailto()
    expect(url).toMatch(/^mailto:support@example\.com\?subject=/)
    expect(url).toContain('Rinse')
    expect(url).toContain('support')
  })

  it('derives billing and privacy emails from support domain', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@rinsehq.com')
    expect(getBillingEmail()).toBe('billing@rinsehq.com')
    expect(getPrivacyEmail()).toBe('privacy@rinsehq.com')
    expect(buildBillingMailto()).toMatch(/^mailto:billing@rinsehq\.com/)
    expect(buildPrivacyMailto()).toMatch(/^mailto:privacy@rinsehq\.com/)
  })

  it('prefers explicit billing and privacy env overrides', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@rinsehq.com')
    vi.stubEnv('NEXT_PUBLIC_BILLING_EMAIL', 'billing@custom.com')
    vi.stubEnv('NEXT_PUBLIC_PRIVACY_EMAIL', 'privacy@custom.com')
    expect(getBillingEmail()).toBe('billing@custom.com')
    expect(getPrivacyEmail()).toBe('privacy@custom.com')
  })
})
