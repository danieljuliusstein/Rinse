import { describe, expect, it } from 'vitest'
import { parseReceiptHeuristics } from './receipt-heuristics'

const SAMPLE = `
AUTOZONE #4821
123 MAIN ST
07/12/2026
CERAMIC SPRAY          24.99
MICROFIBER 3PK         12.99
SUBTOTAL               37.98
TAX                     3.84
TOTAL                  47.82
`

describe('parseReceiptHeuristics', () => {
  it('extracts merchant, date, total and toggles product vs summary lines', () => {
    const result = parseReceiptHeuristics(SAMPLE)
    expect(result.merchant).toMatch(/AUTOZONE/i)
    expect(result.date).toBe('2026-07-12')
    expect(result.total).toBe(47.82)

    const ceramic = result.lines.find((l) => /CERAMIC/i.test(l.text))
    const tax = result.lines.find((l) => /^TAX\b/i.test(l.text))
    const total = result.lines.find((l) => /^TOTAL\b/i.test(l.text))
    const sub = result.lines.find((l) => /SUBTOTAL/i.test(l.text))

    expect(ceramic?.included).toBe(true)
    expect(ceramic?.amount).toBe(24.99)
    expect(tax?.included).toBe(false)
    expect(total?.included).toBe(false)
    expect(sub?.included).toBe(false)
  })

  it('returns empty lines for blank text', () => {
    expect(parseReceiptHeuristics('').lines).toEqual([])
    expect(parseReceiptHeuristics('   ').merchant).toBeUndefined()
  })
})
