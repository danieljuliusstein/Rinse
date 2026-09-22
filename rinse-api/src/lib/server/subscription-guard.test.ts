import { describe, expect, it } from 'vitest'
import { isSubscriptionActive } from '../subscription'
import { PREMIUM_REQUIRED_CODE, premiumRequiredJson } from './subscription-guard'

describe('subscription-guard', () => {
  it('returns 402 with premium code', async () => {
    const res = premiumRequiredJson()
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.code).toBe(PREMIUM_REQUIRED_CODE)
    expect(body.error).toBeTruthy()
  })

  it('blocks lapsed org for premium routes', () => {
    const org = {
      plan: 'starter',
      founding_member: false,
      subscription_status: 'canceled',
    }
    expect(isSubscriptionActive(org)).toBe(false)
  })

  it('does not grant trial access', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const org = {
      plan: 'starter',
      founding_member: false,
      subscription_status: 'trialing',
      trial_ends_at: future.toISOString().slice(0, 10),
    }
    expect(isSubscriptionActive(org)).toBe(false)
  })
})
