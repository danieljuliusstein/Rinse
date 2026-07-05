import { describe, expect, it } from 'vitest'
import { isDefinitiveAuthFailure } from './pb-auth'

describe('isDefinitiveAuthFailure', () => {
  it('treats 401/403 as definitive', () => {
    expect(isDefinitiveAuthFailure({ status: 401, message: 'Unauthorized' })).toBe(true)
    expect(isDefinitiveAuthFailure({ status: 403, message: 'Forbidden' })).toBe(true)
  })

  it('ignores timeouts, aborts, and network blips', () => {
    expect(isDefinitiveAuthFailure(new Error('PocketBase auth refresh timed out'))).toBe(false)
    expect(isDefinitiveAuthFailure({ isAbort: true, message: 'Aborted' })).toBe(false)
    expect(isDefinitiveAuthFailure(new Error('Failed to fetch'))).toBe(false)
    expect(isDefinitiveAuthFailure({ status: 0, message: 'network error' })).toBe(false)
  })
})
