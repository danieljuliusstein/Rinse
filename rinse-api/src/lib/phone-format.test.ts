import { describe, expect, it } from 'vitest'
import {
  formatPhoneAsYouType,
  formatUSPhoneDisplay,
  isValidUSPhone,
  normalizeUSPhone,
} from './phone-format'

describe('phone-format', () => {
  const validDisplay = '(202) 555-0108'
  const validE164 = '+12025550108'

  it('formats as you type for US numbers', () => {
    expect(formatPhoneAsYouType('2025550108')).toBe('(202) 555-0108')
  })

  it('validates US phone numbers', () => {
    expect(isValidUSPhone(validDisplay)).toBe(true)
    expect(isValidUSPhone('123')).toBe(false)
  })

  it('normalizes to E.164', () => {
    expect(normalizeUSPhone(validDisplay)).toBe(validE164)
  })

  it('displays national format for storage values', () => {
    expect(formatUSPhoneDisplay(validE164)).toMatch(/202/)
  })
})
