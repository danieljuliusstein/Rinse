import { describe, expect, it } from 'vitest'
import { applyInventoryDeduction, buildSupplyExpenseLine, inventoryDeltaFromUsageChange } from '../lib/supplies-logic'
import { portalScopeAllowsCheckout, portalScopeAllowsPhotos } from '../lib/server/portal-scope'
import { isValidSignatureDataUrl } from '../lib/server/invoice-signature'
import { isSubscriptionActive } from '../lib/subscription'
import { requirePremiumSubscription, requireProPlan } from '../lib/server/subscription-guard'
import { verificationScope } from './scope'

describe('broad verification scope', () => {
  it('defines all requested areas and required evidence', () => {
    expect(verificationScope.length).toBeGreaterThanOrEqual(9)
    for (const area of verificationScope) {
      expect(area.entrypoints.length).toBeGreaterThan(0)
      expect(area.requiredEvidence.length).toBeGreaterThan(1)
      expect(area.depth.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('inventory and supply persistence invariants', () => {
  it('deducts used inventory without mutating the original collection', () => {
    const supplies = [{ id: 'soap', name: 'Soap', unit: 'oz', quantity_on_hand: 10 }]
    const result = applyInventoryDeduction(supplies, [{ supply_id: 'soap', quantity_used: 3 }])
    expect(result[0]?.quantity_on_hand).toBe(7)
    expect(supplies[0]?.quantity_on_hand).toBe(10)
  })

  it('creates expense lines from catalog cost and computes usage deltas', () => {
    const supply = [{ id: 'soap', name: 'Soap', unit: 'oz', quantity_on_hand: 10, cost_per_unit: 2 }]
    expect(buildSupplyExpenseLine([{ supply_id: 'soap', quantity_used: 3 }], supply)?.amount).toBe(6)
    expect(inventoryDeltaFromUsageChange([{ supply_id: 'soap', quantity_used: 1 }], [{ supply_id: 'soap', quantity_used: 4 }])).toEqual([
      { supply_id: 'soap', quantity_used: 3 },
    ])
  })
})

describe('portal and signature authorization invariants', () => {
  it('allows only invoice-capable portal scopes to sign/pay', () => {
    expect(portalScopeAllowsCheckout('invoice')).toBe(true)
    expect(portalScopeAllowsCheckout('photos')).toBe(false)
    expect(portalScopeAllowsPhotos('photos')).toBe(true)
    expect(portalScopeAllowsPhotos('invoice')).toBe(false)
  })

  it('accepts bounded PNG data URLs and rejects other content', () => {
    expect(isValidSignatureDataUrl('data:image/png;base64,abc')).toBe(true)
    expect(isValidSignatureDataUrl('data:image/jpeg;base64,abc')).toBe(false)
    expect(isValidSignatureDataUrl('')).toBe(false)
  })
})

describe('subscription and premium authorization invariants', () => {
  it('recognizes active trial and subscription states', () => {
    expect(isSubscriptionActive({ plan: 'pro', subscription_status: 'active' })).toBe(true)
    expect(isSubscriptionActive({ plan: 'pro', subscription_status: 'canceled' })).toBe(false)
    expect(isSubscriptionActive({ plan: 'free', subscription_status: 'trialing', trial_ends_at: '2099-01-01' })).toBe(true)
  })

  it('returns explicit authorization responses for missing or insufficient plans', async () => {
    const pb = {
      collection: () => ({
        getOne: async () => ({ plan: 'free', subscription_status: 'none' }),
      }),
    } as never
    const premium = await requirePremiumSubscription(pb, 'org-1')
    expect(premium?.status).toBe(402)
    const pro = await requireProPlan(pb, 'org-1')
    expect(pro?.status).toBe(402)
  })
})
