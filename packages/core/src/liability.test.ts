import { describe, expect, it } from 'vitest'
import {
  formatLiabilityTimestamp,
  jobHasPreJobInspection,
  liabilityTimestamp,
  requiresPreJobInspection,
} from './liability'

describe('liability helpers', () => {
  it('prefers uploaded_at over captured_at', () => {
    expect(
      liabilityTimestamp({
        uploaded_at: '2026-07-12T15:00:00.000Z',
        captured_at: '2026-07-12T10:00:00.000Z',
      }),
    ).toBe('2026-07-12T15:00:00.000Z')
  })

  it('formats liability timestamps', () => {
    expect(formatLiabilityTimestamp('2026-07-12T15:00:00.000Z')).not.toBe('—')
  })

  it('detects completed inspection', () => {
    expect(jobHasPreJobInspection({ inspection_completed_at: '2026-07-12T15:00:00.000Z' })).toBe(
      true,
    )
    expect(jobHasPreJobInspection({})).toBe(false)
  })

  it('requires inspection when entering in_progress', () => {
    expect(requiresPreJobInspection('scheduled', 'in_progress')).toBe(true)
    expect(requiresPreJobInspection('in_progress', 'in_progress')).toBe(false)
    expect(requiresPreJobInspection('scheduled', 'completed')).toBe(false)
  })
})
