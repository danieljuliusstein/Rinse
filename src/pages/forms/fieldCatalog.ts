import type { FieldType } from '@/lib/types'

export type CatalogItem = {
  type: Extract<FieldType, 'text' | 'email' | 'phone' | 'textarea' | 'select'>
  label: string
  defaultLabel: string
  defaultPlaceholder?: string
  defaultOptions?: string[]
}

/** v1 palette — checkbox / hidden land in a later pass */
export const FIELD_CATALOG: readonly CatalogItem[] = [
  { type: 'text', label: 'Single-line text', defaultLabel: 'Text', defaultPlaceholder: 'Enter text' },
  { type: 'email', label: 'Email', defaultLabel: 'Email', defaultPlaceholder: 'name@example.com' },
  { type: 'phone', label: 'Phone', defaultLabel: 'Phone', defaultPlaceholder: '+1 …' },
  { type: 'textarea', label: 'Multi-line text', defaultLabel: 'Message', defaultPlaceholder: 'Write a message…' },
  {
    type: 'select',
    label: 'Dropdown',
    defaultLabel: 'Choose one',
    defaultOptions: ['Option A', 'Option B', 'Option C'],
  },
] as const

export function catalogItemFor(type: FieldType): CatalogItem | undefined {
  return FIELD_CATALOG.find((c) => c.type === type)
}

export function paletteId(type: FieldType): string {
  return `palette:${type}`
}

export function isPaletteId(id: string | number): boolean {
  return String(id).startsWith('palette:')
}
