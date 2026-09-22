import { beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'
const mocks = vi.hoisted(() => ({ sync: vi.fn(), reconcile: vi.fn(), command: vi.fn(), connect: vi.fn() }))
vi.mock('./subscription-sync', () => ({ syncStripeSubscription: mocks.sync }))
vi.mock('./payment-sync', () => ({ reconcileCharge: mocks.reconcile }))
vi.mock('./billing-store', () => ({ billingCommand: mocks.command }))
vi.mock('./stripe-connect', () => ({ syncConnectAccountToOrg: mocks.connect }))
vi.mock('./stripe', async () => {
  const { default: Stripe } = await import('stripe')
  return { getStripe: () => new Stripe('sk_test_local_signature_test') }
})
import { POST as subscription } from '../../app/api/stripe/operator-webhook/route'
import { POST as payment } from '../../app/api/stripe/webhook/route'
const stripe = new Stripe('sk_test_local_signature_test')
const secret = 'whsec_local_test'
function request(event: object, valid = true) {
  const payload = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: valid ? secret : 'wrong_secret' })
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': signature } })
}
beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_OPERATOR_WEBHOOK_SECRET = secret
  process.env.STRIPE_WEBHOOK_SECRET = secret
})
describe('billing webhook trust boundaries', () => {
  it('rejects invalid signatures before any state change', async () => {
    const event = { id: 'evt_test', type: 'charge.succeeded', account: 'acct_operator', data: { object: { id: 'ch_test' } } }
    expect((await payment(request(event, false))).status).toBe(400)
    expect((await subscription(request(event, false))).status).toBe(400)
    expect(mocks.reconcile).not.toHaveBeenCalled()
    expect(mocks.sync).not.toHaveBeenCalled()
  })
  it('passes only the authenticated connected account to payment reconciliation', async () => {
    expect((await payment(request({ id: 'evt_test', type: 'charge.succeeded', account: 'acct_operator', data: { object: { id: 'ch_test' } } }))).status).toBe(200)
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.anything(), 'acct_operator', 'ch_test')
  })
  it('does not treat connected subscriptions as Rinse subscriptions', async () => {
    expect((await subscription(request({ id: 'evt_test', type: 'customer.subscription.updated', account: 'acct_operator', data: { object: { id: 'sub_test' } } }))).status).toBe(400)
    expect(mocks.sync).not.toHaveBeenCalled()
  })
  it('reconciles verified platform subscriptions using event identity and ordering', async () => {
    expect((await subscription(request({ id: 'evt_test', created: 1234, type: 'customer.subscription.updated', data: { object: { id: 'sub_test' } } }))).status).toBe(200)
    expect(mocks.sync).toHaveBeenCalledWith(expect.anything(), 'sub_test', 'evt_test', 1234000)
  })
})
