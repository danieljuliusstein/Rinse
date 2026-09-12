import type { ElementType, InvoiceEditorTemplateId } from './types'

export const PAPER_WIDTH = 620
export const PAPER_HEIGHT = Math.round((PAPER_WIDTH * 11) / 8.5)
export const PAPER_MARGIN = 28

export const SNAP_THRESHOLD = 6

export const SPACING_SCALE = [0, 4, 8, 12, 16, 24, 32] as const

export const ACCENT_SWATCHES = ['#22c55e', '#378add', '#7f77dd', '#2c2c2a', '#f59e0b'] as const

export const PALETTE: { type: ElementType; label: string }[] = [
  { type: 'logo', label: 'Logo' },
  { type: 'business', label: 'Business' },
  { type: 'meta', label: 'Meta' },
  { type: 'lineItems', label: 'Line items' },
  { type: 'service', label: 'Service' },
  { type: 'bodyText', label: 'Body text' },
  { type: 'totals', label: 'Totals' },
  { type: 'notes', label: 'Notes' },
]

export const DEFAULT_ELEMENT_SIZE: Record<ElementType, { w: number; h: number }> = {
  logo: { w: 56, h: 56 },
  business: { w: 240, h: 72 },
  meta: { w: 564, h: 48 },
  lineItems: { w: 564, h: 140 },
  service: { w: 564, h: 36 },
  bodyText: { w: 564, h: 48 },
  totals: { w: 240, h: 88 },
  notes: { w: 564, h: 40 },
}

export const STABLE_ELEMENT_ID: Record<ElementType, string> = {
  logo: 'block-logo',
  business: 'block-business',
  meta: 'block-meta',
  lineItems: 'block-line-items',
  service: 'block-service',
  bodyText: 'block-body-text',
  totals: 'block-totals',
  notes: 'block-notes',
}

export const EDITOR_TEMPLATES: {
  id: InvoiceEditorTemplateId
  label: string
  description: string
}[] = [
  { id: 'rinse', label: 'Rinse', description: 'Logo left, business right, stacked body' },
  { id: 'classic', label: 'Classic', description: 'Centered meta, traditional feel' },
  { id: 'minimal', label: 'Minimal', description: 'Tighter spacing, single column' },
]

/** Suggested document titles for the meta block heading. */
export const DOCUMENT_TITLE_OPTIONS = [
  'Invoice',
  'Tax Invoice',
  'Receipt',
  'Statement',
  'Bill',
  'Service Invoice',
] as const

export const DEFAULT_DOCUMENT_TITLE = 'Invoice'

export const DEFAULT_BODY_TEXT = 'Add body copy for this invoice…'
export const DEFAULT_SERVICE_DESCRIPTION = 'Custom service'
export const DEFAULT_SERVICE_AMOUNT = 0

export const EDITOR_CHROME = {
  bg: '#1c1c1e',
  surface: '#2c2c2e',
  border: '#3a3a3c',
  text: '#f5f5f7',
  textMuted: '#8e8e93',
  paper: '#ffffff',
  danger: '#ef4444',
  green: '#22c55e',
} as const
