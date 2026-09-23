import { appApiJson } from "./app-api"
export type PricingOffer = {
  offer: "early" | "starter"
  early: { available: boolean; priceLabel: string }
  starter: { priceLabel: string }
}
export function loadPricingOffer() {
  return appApiJson<PricingOffer>("/api/billing/pricing")
}
export async function startDesktopCheckout() {
  const result = await appApiJson<{ url: string }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ context: "desktop_onboarding" }),
  })
  window.location.assign(result.url)
}

export async function startDesktopBillingPortal() {
  const result = await appApiJson<{ url: string }>("/api/billing/portal", {
    method: "POST",
    body: JSON.stringify({ context: "desktop_onboarding" }),
  })
  window.location.assign(result.url)
}
