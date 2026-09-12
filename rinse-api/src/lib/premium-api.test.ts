import { describe, expect, it } from 'vitest'
import { isPremiumRequiredPocketBaseError } from './premium-api'

describe('isPremiumRequiredPocketBaseError', () => {
  it('matches PocketBase 403 subscription message', () => {
    expect(
      isPremiumRequiredPocketBaseError({
        status: 403,
        message: 'Active subscription required.',
      }),
    ).toBe(true)
  })

  it('ignores other 403 errors', () => {
    expect(isPremiumRequiredPocketBaseError({ status: 403, message: 'Forbidden' })).toBe(false)
  })

  it('ignores non-403 errors', () => {
    expect(
      isPremiumRequiredPocketBaseError({ status: 400, message: 'Active subscription required' }),
    ).toBe(false)
  })
})
