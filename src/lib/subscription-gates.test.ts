import { describe, expect, it, vi } from 'vitest'
import {
  PREMIUM_ACTION_LABELS,
  resolveGate,
  resolveSubscriptionMode,
  isSubscriptionLapsed,
  isTrialBannerDismissed,
  dismissTrialBanner,
  TRIAL_NUDGE_DAYS,
} from './subscription-gates'

const futureTrialEnd = () => {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return d.toISOString().slice(0, 10)
}

const soonTrialEnd = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

describe('subscription-gates', () => {
  it('full access for active subscription', () => {
    expect(
      resolveSubscriptionMode(
        { plan: 'starter', founding_member: false, subscription_status: 'active' },
        false
      )
    ).toBe('full')
  })

  it('nudge when trialing with few days left', () => {
    expect(
      resolveSubscriptionMode(
        {
          plan: 'starter',
          founding_member: false,
          subscription_status: 'trialing',
          trial_ends_at: soonTrialEnd(),
        },
        false
      )
    ).toBe('nudge')
  })

  it('full when trialing with more than nudge window', () => {
    expect(
      resolveSubscriptionMode(
        {
          plan: 'starter',
          founding_member: false,
          subscription_status: 'trialing',
          trial_ends_at: futureTrialEnd(),
        },
        false
      )
    ).toBe('full')
  })

  it('lapsed when trial expired', () => {
    const org = {
      plan: 'starter',
      founding_member: false,
      subscription_status: 'trialing',
      trial_ends_at: '2020-01-01',
    }
    expect(resolveSubscriptionMode(org, false)).toBe('lapsed')
    expect(isSubscriptionLapsed(org, false)).toBe(true)
  })

  it('allows action when full', () => {
    const result = resolveGate(
      { plan: 'starter', founding_member: false, subscription_status: 'active' },
      false,
      'send_invoice'
    )
    expect(result.allowed).toBe(true)
    expect(result.showPaywall).toBe(false)
  })

  it('blocks lapsed actions', () => {
    const result = resolveGate(
      {
        plan: 'starter',
        founding_member: false,
        subscription_status: 'canceled',
      },
      false,
      'send_invoice'
    )
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('lapsed')
    expect(result.showPaywall).toBe(true)
    expect(result.blockAction).toBe(true)
  })

  it('nudge shows paywall until dismissed', () => {
    const org = {
      plan: 'starter',
      founding_member: false,
      subscription_status: 'trialing',
      trial_ends_at: soonTrialEnd(),
    }
    const blocked = resolveGate(org, false, 'send_quote')
    expect(blocked.showPaywall).toBe(true)
    expect(blocked.featureLabel).toBe(PREMIUM_ACTION_LABELS.send_quote)

    const allowed = resolveGate(org, false, 'send_quote', { nudgeDismissed: true })
    expect(allowed.allowed).toBe(true)
    expect(allowed.showPaywall).toBe(false)
  })

  it('uses TRIAL_NUDGE_DAYS threshold', () => {
    expect(TRIAL_NUDGE_DAYS).toBe(3)
  })

  it('tracks trial banner dismiss in session', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })
    vi.stubGlobal('window', { sessionStorage: globalThis.sessionStorage })

    expect(isTrialBannerDismissed()).toBe(false)
    dismissTrialBanner()
    expect(isTrialBannerDismissed()).toBe(true)
  })
})
