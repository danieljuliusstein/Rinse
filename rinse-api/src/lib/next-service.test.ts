import { describe, expect, it } from 'vitest'
import { daysUntilNextService, suggestNextServiceDate } from './next-service'

describe('suggestNextServiceDate', () => {
  it('adds expected return days to last job date', () => {
    expect(suggestNextServiceDate('2026-01-15', 30)).toBe('2026-02-14')
  })

  it('normalizes invalid cadence to default', () => {
    expect(suggestNextServiceDate('2026-01-01', 0)).toBe('2026-04-01')
  })
})

describe('daysUntilNextService', () => {
  it('returns positive days when next service is in the future', () => {
    const days = daysUntilNextService('2026-05-01', 30, new Date('2026-05-15T12:00:00'))
    expect(days).toBeGreaterThan(0)
  })

  it('returns negative when overdue', () => {
    const days = daysUntilNextService('2026-01-01', 30, new Date('2026-06-01T12:00:00'))
    expect(days).toBeLessThan(0)
  })
})
