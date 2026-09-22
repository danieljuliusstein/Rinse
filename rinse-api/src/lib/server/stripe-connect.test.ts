import { describe, expect, it } from 'vitest'
import { connectLinkStrategy, connectStatusFromAccount } from './stripe-connect'

describe('connectStatusFromAccount', () => {
  it('marks ready when charges and details are submitted', () => {
    const status = connectStatusFromAccount({
      controller: { fees: { payer: 'account' }, losses: { payments: 'stripe' } },
      id: 'acct_test',
      charges_enabled: true,
      details_submitted: true,
    } as never)
    expect(status.ready).toBe(true)
    expect(status.accountId).toBe('acct_test')
  })

  it('is not ready when onboarding incomplete', () => {
    const status = connectStatusFromAccount({
      controller: { fees: { payer: 'account' }, losses: { payments: 'stripe' } },
      id: 'acct_test',
      charges_enabled: false,
      details_submitted: false,
    } as never)
    expect(status.ready).toBe(false)
  })
})

describe('connectLinkStrategy', () => {
  it('uses login link when connect is ready', () => {
    expect(
      connectLinkStrategy({
        payoutsEnabled: false, requirements: [],
        accountId: 'acct_test',
        chargesEnabled: true,
        detailsSubmitted: true,
        ready: true,
      }),
    ).toBe('login')
  })

  it('uses onboarding link when connect is not ready', () => {
    expect(
      connectLinkStrategy({
        payoutsEnabled: false, requirements: [],
        accountId: 'acct_test',
        chargesEnabled: false,
        detailsSubmitted: true,
        ready: false,
      }),
    ).toBe('onboarding')
  })
})
