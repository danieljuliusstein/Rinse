import { describe, expect, it } from 'vitest'
import { MockEmailProvider, MockPdfRenderer, MockStripe } from './external-contracts'

describe('external integration contract adapters', () => {
  it('captures Stripe payloads and makes webhook processing idempotent', async () => {
    const stripe = new MockStripe()
    const session = await stripe.createCheckoutSession({ invoiceId: 'invoice-1', amount: 22000, currency: 'usd' })
    expect(session.url).toContain('invoice-1')
    expect(stripe.checkoutCalls[0]).toEqual({ invoiceId: 'invoice-1', amount: 22000, currency: 'usd' })
    expect(stripe.processWebhook('evt_1')).toBe(true)
    expect(stripe.processWebhook('evt_1')).toBe(false)
  })

  it('captures email payloads and preserves PDF invoice evidence', async () => {
    const email = new MockEmailProvider()
    await email.send({ to: 'customer@example.com', subject: 'Invoice', html: '<p>Invoice DET-001</p>' })
    expect(email.sent[0]?.to).toBe('customer@example.com')

    const pdf = await new MockPdfRenderer().renderInvoice({ invoiceNumber: 'DET-001', total: 220 })
    const text = new TextDecoder().decode(pdf)
    expect(text).toContain('DET-001')
    expect(text).toContain('220.00')
  })
})
