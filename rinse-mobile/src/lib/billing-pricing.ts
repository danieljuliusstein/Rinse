import { appApiJson } from './app-api'
import { EARLY_PLAN, FOUNDING_PLAN, FREE_PLAN, STARTER_PLAN } from './plans'

export type PricingOffer = 'founding' | 'early' | 'starter'

export type BillingPricing = {
  offer: PricingOffer
  founding: { limit: number; remaining: number; priceLabel: string }
  early: { limit: number; remaining: number; priceLabel: string; available: boolean }
  starter: { priceLabel: string }
  free: { priceLabel: string }
}

/** Public pricing ladder + remaining founding/early seats. */
export async function fetchBillingPricing(): Promise<BillingPricing> {
  try {
    return await appApiJson<BillingPricing>('/api/billing/pricing', { method: 'GET' })
  } catch {
    return {
      offer: 'starter',
      founding: { limit: 20, remaining: 0, priceLabel: FOUNDING_PLAN.priceLabel },
      early: { limit: 100, remaining: 0, priceLabel: EARLY_PLAN.priceLabel, available: false },
      starter: { priceLabel: STARTER_PLAN.priceLabel },
      free: { priceLabel: FREE_PLAN.priceLabel },
    }
  }
}

/** Price label for the current upgrade CTA (Early $6 while seats remain). */
export function upgradePriceLabel(pricing: BillingPricing | null): string {
  if (pricing?.early.available) return EARLY_PLAN.priceLabel
  return STARTER_PLAN.priceLabel
}
