import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assertCanWrite, canWriteData, SignInRequiredError } from './write-guard'

vi.mock('./pb-auth', () => ({
  isPocketBaseAuthenticated: vi.fn(),
}))

vi.mock('./pocketbase', () => ({
  isPocketBaseConfigured: vi.fn(),
}))

import { isPocketBaseAuthenticated } from './pb-auth'
import { isPocketBaseConfigured } from './pocketbase'

describe('write-guard', () => {
  beforeEach(() => {
    vi.mocked(isPocketBaseConfigured).mockReturnValue(true)
    vi.mocked(isPocketBaseAuthenticated).mockReturnValue(false)
  })

  it('blocks writes when cloud is configured but user is logged out', () => {
    expect(canWriteData()).toBe(false)
    expect(() => assertCanWrite()).toThrow(SignInRequiredError)
  })

  it('allows writes when logged in', () => {
    vi.mocked(isPocketBaseAuthenticated).mockReturnValue(true)
    expect(canWriteData()).toBe(true)
    expect(() => assertCanWrite()).not.toThrow()
  })

  it('allows local-only dev writes when pocketbase is not configured', () => {
    vi.mocked(isPocketBaseConfigured).mockReturnValue(false)
    expect(canWriteData()).toBe(true)
  })

  it('throws SignInRequiredError with a helpful message', () => {
    try {
      assertCanWrite()
      expect.fail('expected throw')
    } catch (error) {
      expect(error).toBeInstanceOf(SignInRequiredError)
      expect((error as SignInRequiredError).message).toMatch(/sign in/i)
    }
  })
})
