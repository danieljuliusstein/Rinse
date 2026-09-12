import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const BANNED = ['#16a34a', '#4caf50'] as const
const ALLOWED_EXCEPTIONS = new Set(['--inv-ok: #3dc97a'])

function walkCss(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) out.push(...walkCss(path))
    else if (name.endsWith('.css')) out.push(path)
  }
  return out
}

describe('css accent guard', () => {
  it('does not use legacy green hex in app CSS', () => {
    const root = join(process.cwd(), 'src/app')
    const files = walkCss(root)
    const violations: string[] = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      for (const hex of BANNED) {
        if (content.toLowerCase().includes(hex)) {
          violations.push(`${file}: ${hex}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('allows inventory semantic --inv-ok', () => {
    expect(ALLOWED_EXCEPTIONS.has('--inv-ok: #3dc97a')).toBe(true)
  })
})
