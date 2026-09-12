import { describe, expect, it } from 'vitest'
import {
  formatBillingLineDetail,
  lineAmount,
  normalizeBillingLine,
  sumLineAmounts,
} from './billing-lines'

describe('billing lines', () => {
  it('computes quantity × unit_price', () => {
    expect(lineAmount({ quantity: 2.5, unit_price: 50, default_amount: 0 })).toBe(125)
  })

  it('falls back to default_amount for legacy rows', () => {
    expect(lineAmount({ default_amount: 95 })).toBe(95)
  })

  it('normalizes legacy default_amount into qty 1 × unit_price', () => {
    const line = normalizeBillingLine({ id: 'a', description: 'Ceramic', default_amount: 95 })
    expect(line).toMatchObject({
      quantity: 1,
      unit_price: 95,
      unit: 'each',
      default_amount: 95,
    })
  })

  it('keeps default_amount in sync with hybrid fields', () => {
    const line = normalizeBillingLine({
      id: 'b',
      description: 'Labor',
      quantity: 2.5,
      unit_price: 50,
      unit: 'hour',
    })
    expect(line.default_amount).toBe(125)
  })

  it('sums hybrid package extras', () => {
    expect(
      sumLineAmounts([
        { quantity: 1, unit_price: 150, default_amount: 150 },
        { quantity: 2.5, unit_price: 50, default_amount: 125 },
      ]),
    ).toBe(275)
  })

  it('formats hour detail labels', () => {
    expect(
      formatBillingLineDetail({ quantity: 2.5, unit_price: 50, unit: 'hour' }),
    ).toMatch(/2\.5 hr/)
  })
})
