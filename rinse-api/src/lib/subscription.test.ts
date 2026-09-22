import { describe, expect, it } from 'vitest'
import { hasStarterAccess, canActivateJob, countsTowardActiveJobLimit, type OrgSubscription } from '../../../packages/core/src/pricing'
const free: OrgSubscription = { plan: 'free', founding_member: false, subscription_status: 'none' }
const paid = { ...free, plan: 'starter', subscription_status: 'active', current_period_end: '2030-01-01T00:00:00Z' }
describe('entitlements', () => {
  it('only counts scheduled and in-progress work', () => {
    expect(['scheduled','in_progress','completed','invoiced','paid','cancelled'].filter(countsTowardActiveJobLimit)).toEqual(['scheduled','in_progress'])
  })
  it('preserves existing work above the limit and blocks new/reopened work', () => {
    expect(canActivateJob(free, 7, true, 'in_progress')).toBe(true)
    expect(canActivateJob(free, 7, false, 'scheduled')).toBe(false)
    expect(canActivateJob(free, 7, true, 'completed')).toBe(true)
    expect(canActivateJob(free, 4, false, 'scheduled')).toBe(true)
  })
  it('keeps cancellation-at-period-end access and removes terminated/expired access', () => {
    expect(hasStarterAccess({ ...paid, cancel_at_period_end: true })).toBe(true)
    expect(hasStarterAccess({ ...paid, subscription_status: 'canceled' })).toBe(false)
    expect(hasStarterAccess({ ...paid, current_period_end: '2020-01-01' })).toBe(false)
    expect(hasStarterAccess({ ...paid, subscription_status: 'past_due' })).toBe(false)
  })
  it('does not grant access from trial, customer IDs or a forged plan alone', () => {
    expect(hasStarterAccess({ ...free, plan: 'starter', stripe_customer_id: 'cus_123' })).toBe(false)
    expect(hasStarterAccess({ ...paid, subscription_status: 'trialing' })).toBe(false)
    expect(hasStarterAccess({ ...free, plan: 'founding' })).toBe(false)
    expect(hasStarterAccess({ ...free, plan: 'founding', founding_member: true })).toBe(true)
  })
})
