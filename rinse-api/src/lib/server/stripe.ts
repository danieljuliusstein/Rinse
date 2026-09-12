import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function isStripeLiveMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY?.trim() ?? '').startsWith('sk_live_')
}

/** Public app URL for Stripe redirects — must be https:// in live mode. */
export function stripeAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const origin = (configured || new URL(request.url).origin).replace(/\/$/, '')
  if (isStripeLiveMode() && !origin.startsWith('https://')) {
    throw new Error(
      'Live Stripe requires HTTPS redirect URLs. Use test keys on localhost, or set NEXT_PUBLIC_APP_URL=https://your-domain.com',
    )
  }
  return origin
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  if (!stripeClient) {
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}
