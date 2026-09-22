import { describe, expect, it, vi } from 'vitest'
import { reconcileDeposit } from './payment-sync'
import * as pbAdmin from './pocketbase-admin'

describe('deposit booking & reconciliation', () => {
  it('updates job record with deposit_status paid and timestamp on reconciliation', async () => {
    const updateMock = vi.fn().mockResolvedValue({ id: 'job_123', deposit_status: 'paid' })
    const fakePb = {
      collection: vi.fn().mockReturnValue({
        update: updateMock,
      }),
    }
    vi.spyOn(pbAdmin, 'authenticateServerAdmin').mockResolvedValue(fakePb as any)

    await reconcileDeposit('job_123', 50)

    expect(fakePb.collection).toHaveBeenCalledWith('jobs')
    expect(updateMock).toHaveBeenCalledWith('job_123', expect.objectContaining({
      deposit_status: 'paid',
      deposit_amount: 50,
      deposit_paid_at: expect.any(String),
    }))
  })
})
