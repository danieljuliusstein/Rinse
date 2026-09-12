import { describe, expect, it } from 'vitest'
import { checkRateLimit, checkRateLimitAsync, isUpstashRateLimitEnabled, RATE_LIMITS } from './rate-limit'

describe('rate-limit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Date.now()}-a`
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true)
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true)
  })

  it('blocks after the limit is reached', () => {
    const key = `test-${Date.now()}-b`
    const config = { limit: 2, windowMs: 60_000 }
    expect(checkRateLimit(key, config).ok).toBe(true)
    expect(checkRateLimit(key, config).ok).toBe(true)
    const blocked = checkRateLimit(key, config)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('exposes preset configs', () => {
    expect(RATE_LIMITS.signup.limit).toBeGreaterThan(0)
    expect(RATE_LIMITS.publicBookingIp.windowMs).toBeGreaterThan(0)
  })

  it('falls back to in-memory when Upstash is not configured', async () => {
    expect(isUpstashRateLimitEnabled()).toBe(false)
    const key = `test-async-${Date.now()}`
    const config = { limit: 1, windowMs: 60_000 }
    expect((await checkRateLimitAsync(key, config, 'test')).ok).toBe(true)
    expect((await checkRateLimitAsync(key, config, 'test')).ok).toBe(false)
  })
})
