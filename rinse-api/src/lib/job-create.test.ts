import { describe, expect, it, vi, afterEach } from 'vitest'
import { defaultQuickJobStatus, localCalendarDate } from './job-create'

describe('defaultQuickJobStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('schedules future jobs and completes today/past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T15:00:00'))

    expect(localCalendarDate()).toBe('2026-07-05')
    expect(defaultQuickJobStatus('2026-07-05')).toBe('completed')
    expect(defaultQuickJobStatus('2026-07-04')).toBe('completed')
    expect(defaultQuickJobStatus('2026-07-06')).toBe('scheduled')
  })
})
