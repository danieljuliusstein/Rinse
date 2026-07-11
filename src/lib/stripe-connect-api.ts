import { appApiJson } from './app-api'

export type StripeConnectStatus = {
  accountId: string | null
  chargesEnabled: boolean
  detailsSubmitted: boolean
  ready: boolean
}

export async function fetchStripeConnectStatus(): Promise<StripeConnectStatus> {
  return appApiJson<StripeConnectStatus>('/api/stripe/connect/status')
}

export async function startStripeConnectOnboard(): Promise<string> {
  const data = await appApiJson<{ url?: string }>('/api/stripe/connect/onboard', { method: 'POST' })
  const url = data.url?.trim()
  if (!url) throw new Error('Could not open Stripe')
  return url
}
