import type { CSSProperties } from 'react'

export const DEFAULT_ACCENT = '#22c55e'

const HEX_RE = /^#([0-9a-fA-F]{6})$/

export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value.trim())
}

export function normalizeAccentColor(value?: string | null): string {
  const trimmed = value?.trim()
  if (trimmed && isValidHexColor(trimmed)) return trimmed.toLowerCase()
  return DEFAULT_ACCENT
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeAccentColor(hex).slice(1)
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export function accentTint(hex: string, alpha = 0.09): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function accentBorder(hex: string, alpha = 0.3): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function accentHover(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const darken = (n: number) => Math.max(0, Math.round(n * 0.88))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`
}

export function brandCssVars(accent?: string | null): CSSProperties {
  const color = normalizeAccentColor(accent)
  return {
    '--cl-accent': color,
    '--cl-accent-bg': accentTint(color),
    '--cl-accent-bdr': accentBorder(color),
  } as CSSProperties
}
