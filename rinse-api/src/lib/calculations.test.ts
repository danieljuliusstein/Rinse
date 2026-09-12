import { describe, expect, it } from 'vitest'
import { fmt, fmtDetailed, fmtLineItem, fmtSigned } from './calculations'

describe('fmt', () => {
  it('formats whole dollars without decimals', () => {
    expect(fmt(44168)).toBe('$44,168')
  })

  it('prefixes minus for negative values', () => {
    expect(fmt(-108315)).toBe('-$108,315')
  })

  it('shows unsigned magnitude when requested', () => {
    expect(fmt(-500, { unsigned: true })).toBe('$500')
  })
})

describe('fmtLineItem', () => {
  it('omits cents for whole amounts', () => {
    expect(fmtLineItem(150)).toBe('$150')
  })

  it('shows cents when fractional', () => {
    expect(fmtLineItem(150.5)).toBe('$150.50')
  })

  it('prefixes minus for negative line items', () => {
    expect(fmtLineItem(-12.34)).toBe('-$12.34')
  })
})

describe('fmtDetailed', () => {
  it('always uses two decimal places', () => {
    expect(fmtDetailed(100)).toBe('$100.00')
  })

  it('prefixes minus for losses', () => {
    expect(fmtDetailed(-44.06)).toBe('-$44.06')
  })
})

describe('fmtSigned', () => {
  it('matches macro loss formatting', () => {
    expect(fmtSigned(-44060, 0)).toBe('-$44,060')
  })
})
