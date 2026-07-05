import { describe, expect, it } from 'vitest'
import { truncateMiddle } from './truncate'

describe('truncateMiddle', () => {
  it('returns short strings unchanged', () => {
    expect(truncateMiddle('https://rinse.app/book/acme')).toBe('https://rinse.app/book/acme')
  })

  it('truncates long strings in the middle', () => {
    const url = 'https://example.com/book/very-long-business-slug-name-here'
    expect(truncateMiddle(url, 22, 14)).toBe('https://example.com/bo…slug-name-here')
  })
})
