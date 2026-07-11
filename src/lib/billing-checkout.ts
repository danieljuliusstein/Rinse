import * as WebBrowser from 'expo-web-browser'
import { appApiJson } from './app-api'

export type BillingPlanId = 'starter'

export async function startBillingCheckout(plan: BillingPlanId = 'starter'): Promise<void> {
  const data = await appApiJson<{ url?: string; error?: string }>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })
  const url = typeof data.url === 'string' ? data.url : null
  if (!url) throw new Error(String(data.error ?? 'Could not open checkout'))
  await WebBrowser.openBrowserAsync(url)
}
