import { describe, expect, it } from 'vitest'
import { formatCapturedAt, formatDamageDate, vehicleDisplayName } from './damage-docs'

describe('formatDamageDate', () => {
  it('formats ISO date', () => {
    expect(formatDamageDate('2026-06-02')).toMatch(/Jun 2, 2026/)
  })
})

describe('formatCapturedAt', () => {
  it('formats datetime', () => {
    const out = formatCapturedAt('2026-06-02T09:14:00.000Z')
    expect(out).toContain('2026')
  })
})

describe('vehicleDisplayName', () => {
  it('joins year make model', () => {
    expect(vehicleDisplayName({ year: 2021, make: 'BMW', model: 'X5' })).toBe('2021 BMW X5')
  })
})
