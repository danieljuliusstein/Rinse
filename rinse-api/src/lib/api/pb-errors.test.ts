import { describe, expect, it } from 'vitest'
import { isMissingCollectionError } from './pb-errors'

describe('isMissingCollectionError', () => {
  it('detects 404 status', () => {
    expect(isMissingCollectionError({ status: 404 })).toBe(true)
  })

  it('detects missing collection message', () => {
    expect(isMissingCollectionError({ message: 'Missing collection context.' })).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isMissingCollectionError({ status: 500, message: 'Internal' })).toBe(false)
  })
})
