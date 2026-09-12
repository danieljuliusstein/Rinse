import { describe, expect, it } from 'vitest'
import { computeProfileCompletion } from './profile-completion'
import type { AppSettings } from './settings'

const base: AppSettings = {
  business_name: 'Rinse',
  business_phone: '(404) 555-0142',
  business_email: 'hello@atlas.com',
  business_address: '1200 Peachtree St, Atlanta, GA',
  invoice_terms_footer: 'Due on receipt.',
  notifications: {
    job_reminder: true,
    morning_reminder: true,
    follow_up: true,
    invoice_overdue: true,
    low_inventory: true,
  },
  logo_url: '/api/business-logo?slug=atlas',
}

describe('computeProfileCompletion', () => {
  it('marks complete when all profile fields are set', () => {
    const result = computeProfileCompletion(base)
    expect(result.isComplete).toBe(true)
    expect(result.percent).toBe(100)
    expect(result.nextStep).toBeNull()
  })

  it('surfaces the next missing step', () => {
    const result = computeProfileCompletion({ ...base, business_email: '' })
    expect(result.isComplete).toBe(false)
    expect(result.completedCount).toBe(2)
    expect(result.nextStep?.id).toBe('email')
  })

  it('does not require business address', () => {
    const result = computeProfileCompletion({ ...base, business_address: '' })
    expect(result.isComplete).toBe(true)
    expect(result.steps.some((s) => s.id === 'address')).toBe(false)
  })

  it('counts logo as incomplete when default placeholder', () => {
    const result = computeProfileCompletion({ ...base, logo_url: '/logo.png' })
    expect(result.steps.find((s) => s.id === 'logo')?.done).toBe(false)
    expect(result.isComplete).toBe(false)
  })
})
