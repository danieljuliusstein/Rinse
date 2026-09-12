import { describe, expect, it } from 'vitest'
import { LAUNCH_PRICING_ACTIVE, STARTER_PLAN } from './plans'

describe('STARTER_PLAN', () => {
  it('has list price of $29/mo', () => {
    expect(STARTER_PLAN.listPriceLabel).toBe('$29/mo')
  })

  it('reflects launch pricing flag from env', () => {
    if (LAUNCH_PRICING_ACTIVE) {
      expect(STARTER_PLAN.priceLabel).toBe('$19/mo')
      expect(STARTER_PLAN.launchNote).toContain('Launch pricing')
    } else {
      expect(STARTER_PLAN.priceLabel).toBe('$29/mo')
      expect(STARTER_PLAN.launchNote).toBeUndefined()
    }
  })
})
