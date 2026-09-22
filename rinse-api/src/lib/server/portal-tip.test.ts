import { describe, expect, it, vi } from 'vitest'
import { reconcileCharge } from './payment-sync'
import * as pbAdmin from './pocketbase-admin'

describe('portal tip selection & charge reconciliation', () => {
  it('extracts tip_amount from charge metadata and sends tip in integer cents to reconcile-payment', async () => {
    const sendMock = vi.fn().mockResolvedValue({ ok: true })
    const fakePb = {
      send: sendMock,
    }
    vi.spyOn(pbAdmin, 'authenticateServerAdmin').mockResolvedValue(fakePb as any)

    const fakeStripe = {
      charges: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'ch_test123',
          paid: true,
          status: 'succeeded',
          currency: 'usd',
          amount: 12500, // $125.00 total
          amount_refunded: 0,
          metadata: {
            invoice_id: 'inv_456',
            organization_id: 'org_789',
            tip_amount: '25.00', // $25.00 tip
          },
        }),
      },
    }

    await reconcileCharge(fakeStripe as any, 'acct_operator123', 'ch_test123')

    expect(sendMock).toHaveBeenCalledWith('/api/rinse/reconcile-payment', {
      method: 'POST',
      body: {
        invoiceId: 'inv_456',
        accountId: 'acct_operator123',
        paymentId: 'ch_test123',
        amount: 12500,
        refunded: 0,
        tip: 2500, // 2500 cents = $25.00
      },
    })
  })

  it('handles zero tip gracefully', async () => {
    const sendMock = vi.fn().mockResolvedValue({ ok: true })
    const fakePb = {
      send: sendMock,
    }
    vi.spyOn(pbAdmin, 'authenticateServerAdmin').mockResolvedValue(fakePb as any)

    const fakeStripe = {
      charges: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'ch_notip',
          paid: true,
          status: 'succeeded',
          currency: 'usd',
          amount: 10000,
          amount_refunded: 0,
          metadata: {
            invoice_id: 'inv_456',
            organization_id: 'org_789',
          },
        }),
      },
    }

    await reconcileCharge(fakeStripe as any, 'acct_operator123', 'ch_notip')

    expect(sendMock).toHaveBeenCalledWith('/api/rinse/reconcile-payment', {
      method: 'POST',
      body: {
        invoiceId: 'inv_456',
        accountId: 'acct_operator123',
        paymentId: 'ch_notip',
        amount: 10000,
        refunded: 0,
        tip: 0,
      },
    })
  })
})
