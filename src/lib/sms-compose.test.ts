import { describe, expect, it } from 'vitest'
import { buildSmsComposeUrl, normalizePhoneForSms } from './sms-compose'

describe('normalizePhoneForSms', () => {
  it('formats 10-digit US numbers', () => {
    expect(normalizePhoneForSms('555-123-4567')).toBe('+15551234567')
  })

  it('preserves E.164', () => {
    expect(normalizePhoneForSms('+15551234567')).toBe('+15551234567')
  })
})

describe('buildSmsComposeUrl', () => {
  it('includes encoded body with cross-platform separator', () => {
    const url = buildSmsComposeUrl('5551234567', 'Hi Marcus')
    expect(url).toBe('sms:+15551234567?&body=Hi%20Marcus')
  })

  it('returns null for invalid phone', () => {
    expect(buildSmsComposeUrl('', 'Hi')).toBeNull()
  })
})
