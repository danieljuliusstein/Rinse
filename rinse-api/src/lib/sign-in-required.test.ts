import { describe, expect, it } from 'vitest'
import { isSignInRequiredError } from './sign-in-required'
import { SignInRequiredError } from './write-guard'

describe('isSignInRequiredError', () => {
  it('returns true for SignInRequiredError instances', () => {
    expect(isSignInRequiredError(new SignInRequiredError())).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isSignInRequiredError(new Error('nope'))).toBe(false)
    expect(isSignInRequiredError('sign in required')).toBe(false)
    expect(isSignInRequiredError(null)).toBe(false)
  })
})
