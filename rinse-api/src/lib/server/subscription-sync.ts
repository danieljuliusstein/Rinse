import type Stripe from 'stripe'
import { billingCommand } from './billing-store'
import { PRICES } from '../../../../packages/core/src/pricing'
export async function syncStripeSubscription(stripe: Stripe, id: string, eventId: string, order?: number) {
  // Fetch current provider state instead of applying possibly out-of-order event snapshots.
  const sub = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] })
  const orgId = sub.metadata.organization_id
  if (!orgId) throw new Error('Subscription organization is missing')
  const item = sub.items.data[0]
  const price = item?.price
  const plan = price?.id === process.env.STRIPE_PRICE_EARLY_MONTHLY ? 'early' : price?.id === process.env.STRIPE_PRICE_STARTER_MONTHLY ? 'starter' : null
  if (!plan || sub.items.data.length !== 1 || item.quantity !== 1 || price.unit_amount !== PRICES[plan] || price.currency !== 'usd' || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) throw new Error('Unexpected subscription price')
  const invoice = typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null
  return billingCommand({ action: 'sync', orgId, provider: 'stripe', eventId, order, subscriptionId: sub.id,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    plan, status: sub.status, paid: invoice?.status === 'paid' && (invoice.amount_paid ?? 0) > 0,
    periodEnd: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : '', cancelAtPeriodEnd: sub.cancel_at_period_end })
}
