import { describe, expect, it } from 'vitest'
import {
  accentHover,
  accentTint,
  brandCssVars,
  DEFAULT_ACCENT,
  isValidHexColor,
  normalizeAccentColor,
} from './brand-color'

describe('brand-color', () => {
  it('validates hex colors', () => {
    expect(isValidHexColor('#22c55e')).toBe(true)
    expect(isValidHexColor('#22C55E')).toBe(true)
    expect(isValidHexColor('22c55e')).toBe(false)
    expect(isValidHexColor('#abc')).toBe(false)
  })

  it('normalizes invalid values to default', () => {
    expect(normalizeAccentColor(null)).toBe(DEFAULT_ACCENT)
    expect(normalizeAccentColor('not-a-color')).toBe(DEFAULT_ACCENT)
    expect(normalizeAccentColor('#ff5500')).toBe('#ff5500')
  })

  it('builds rgba tints', () => {
    expect(accentTint('#22c55e')).toBe('rgba(34, 197, 94, 0.09)')
    expect(accentHover('#22c55e')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('returns CSS variable props', () => {
    const vars = brandCssVars('#ff5500')
    expect(vars['--cl-accent']).toBe('#ff5500')
    expect(vars['--cl-accent-bg']).toContain('rgba')
  })
})
