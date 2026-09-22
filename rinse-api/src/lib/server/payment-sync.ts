import type Stripe from 'stripe'
import { authenticateServerAdmin } from './pocketbase-admin'

export async function reconcileCharge(stripe: Stripe, accountId: string, chargeId: string) {
  const charge = await stripe.charges.retrieve(chargeId, {}, { stripeAccount: accountId })
  if (!charge.paid || charge.status !== 'succeeded') return
  const invoiceId = charge.metadata.invoice_id
  if (!invoiceId) return
  if (charge.currency !== (process.env.STRIPE_PAYMENT_CURRENCY || 'usd')) {
    throw new Error('Unexpected payment currency')
  }

  const rawTip = charge.metadata.tip_amount ? parseFloat(charge.metadata.tip_amount) : 0
  const tipCents = !isNaN(rawTip) && rawTip > 0 ? Math.round(rawTip * 100) : 0

  const pb = await authenticateServerAdmin()
  await pb.send('/api/rinse/reconcile-payment', {
    method: 'POST',
    body: {
      invoiceId,
      accountId,
      paymentId: charge.id,
      amount: charge.amount,
      refunded: charge.amount_refunded,
      tip: tipCents,
    },
  })
}

export async function reconcileDeposit(jobId: string, depositAmount?: number) {
  const pb = await authenticateServerAdmin()
  const patch: Record<string, unknown> = {
    deposit_status: 'paid',
    deposit_paid_at: new Date().toISOString(),
  }
  if (depositAmount && depositAmount > 0) {
    patch.deposit_amount = depositAmount
  }
  await pb.collection('jobs').update(jobId, patch)
}
