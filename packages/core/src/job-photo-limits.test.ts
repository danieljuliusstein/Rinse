import { describe, expect, it } from 'vitest'
import {
  countJobPhotosByType,
  jobHasBeforeAndAfter,
  jobPhotoCompletenessMessage,
  pairBeforeAfterPhotos,
} from './job-photo-limits'

describe('job photo transformation helpers', () => {
  it('counts before/after', () => {
    expect(
      countJobPhotosByType([
        { type: 'before' },
        { type: 'before' },
        { type: 'after' },
      ]),
    ).toEqual({ before: 2, after: 1, total: 3 })
  })

  it('requires both sides', () => {
    expect(jobHasBeforeAndAfter([{ type: 'before' }])).toBe(false)
    expect(jobHasBeforeAndAfter([{ type: 'before' }, { type: 'after' }])).toBe(true)
  })

  it('pairs by index', () => {
    const pairs = pairBeforeAfterPhotos([
      { type: 'before' as const, id: 'b1' },
      { type: 'after' as const, id: 'a1' },
      { type: 'after' as const, id: 'a2' },
    ])
    expect(pairs).toHaveLength(2)
    expect(pairs[0]?.before?.id).toBe('b1')
    expect(pairs[0]?.after?.id).toBe('a1')
    expect(pairs[1]?.after?.id).toBe('a2')
  })

  it('describes completeness', () => {
    expect(jobPhotoCompletenessMessage({ before: 0, after: 0, total: 0 })).toMatch(/before & after/)
    expect(jobPhotoCompletenessMessage({ before: 1, after: 2, total: 3 })).toBe('1 before · 2 after')
  })
})
