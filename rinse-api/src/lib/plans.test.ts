import { describe, expect, it } from 'vitest'
import { FREE_PLAN, STARTER_PLAN, EARLY_PLAN, FOUNDING_PLAN, PLAN_OPTIONS, PRICES } from './plans'
describe('pricing policy', () => {
  it('has exactly two public plans with the launch offer separate', () => {
    expect(PLAN_OPTIONS.map(p => p.id)).toEqual(['free', 'starter'])
    expect(PRICES).toEqual({ free: 0, starter: 600, early: 300, founding: 0 })
    expect([FREE_PLAN.priceLabel, STARTER_PLAN.priceLabel, EARLY_PLAN.priceLabel, FOUNDING_PLAN.priceLabel]).toEqual(['$0', '$6/mo', '$3/mo', '$0'])
  })
})
