import { describe, expect, it } from 'vitest'
import { generatePocketBaseId } from './pocketbase-id'

describe('generatePocketBaseId', () => {
  it('returns 15 lowercase alphanumeric characters', () => {
    const id = generatePocketBaseId()
    expect(id).toMatch(/^[a-z0-9]{15}$/)
  })

  it('generates unique ids in a batch', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generatePocketBaseId()))
    expect(ids.size).toBe(50)
  })
})
