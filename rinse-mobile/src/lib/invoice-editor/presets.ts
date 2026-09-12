import {
  DEFAULT_BODY_TEXT,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_ELEMENT_SIZE,
  DEFAULT_SERVICE_AMOUNT,
  DEFAULT_SERVICE_DESCRIPTION,
  PAPER_MARGIN,
  PAPER_WIDTH,
  STABLE_ELEMENT_ID,
} from './constants'
import {
  isMultiInstanceType,
  type ElementType,
  type InvoiceEditorLayout,
  type InvoiceEditorTemplateId,
  type PlacedElement,
} from './types'

const CONTENT_W = PAPER_WIDTH - PAPER_MARGIN * 2

function el(
  type: ElementType,
  x: number,
  y: number,
  accent: string,
  overrides?: Partial<
    Pick<
      PlacedElement,
      'w' | 'h' | 'align' | 'locked' | 'spacing' | 'text' | 'serviceDescription' | 'serviceAmount' | 'id'
    >
  >,
): PlacedElement {
  const size = DEFAULT_ELEMENT_SIZE[type]
  return {
    id: overrides?.id ?? STABLE_ELEMENT_ID[type],
    type,
    x,
    y,
    w: overrides?.w ?? size.w,
    h: overrides?.h ?? size.h,
    align: overrides?.align ?? 'left',
    color: accent,
    locked: overrides?.locked ?? false,
    spacing: overrides?.spacing ?? 12,
    text: overrides?.text,
    serviceDescription: overrides?.serviceDescription,
    serviceAmount: overrides?.serviceAmount,
  }
}

export function presetElements(id: InvoiceEditorTemplateId, accent = '#22c55e'): PlacedElement[] {
  switch (id) {
    case 'classic':
      return [
        el('logo', PAPER_MARGIN, 32, accent),
        el('business', PAPER_MARGIN + CONTENT_W - 240, 32, accent, { align: 'right' }),
        el('meta', PAPER_MARGIN, 108, accent, { align: 'center', w: CONTENT_W }),
        el('lineItems', PAPER_MARGIN, 172, accent, { w: CONTENT_W }),
        el('totals', PAPER_MARGIN + CONTENT_W - 240, 328, accent, { align: 'right' }),
        el('notes', PAPER_MARGIN, 720, accent, { w: CONTENT_W, align: 'center' }),
      ]
    case 'minimal':
      return [
        el('business', PAPER_MARGIN, 40, accent, { w: CONTENT_W, align: 'center' }),
        el('meta', PAPER_MARGIN, 120, accent, { w: CONTENT_W }),
        el('lineItems', PAPER_MARGIN, 180, accent, { w: CONTENT_W, h: 160 }),
        el('totals', PAPER_MARGIN + CONTENT_W - 200, 360, accent, { align: 'right', w: 200 }),
        el('notes', PAPER_MARGIN, 740, accent, { w: CONTENT_W }),
      ]
    case 'rinse':
    default:
      return [
        el('logo', PAPER_MARGIN, 32, accent),
        el('business', PAPER_MARGIN + CONTENT_W - 240, 32, accent, { align: 'right' }),
        el('meta', PAPER_MARGIN, 108, accent, { w: CONTENT_W }),
        el('lineItems', PAPER_MARGIN, 168, accent, { w: CONTENT_W }),
        el('totals', PAPER_MARGIN + CONTENT_W - 240, 320, accent, { align: 'right' }),
        el('notes', PAPER_MARGIN, 720, accent, { w: CONTENT_W }),
      ]
  }
}

export function createLayoutFromTemplate(
  templateId: InvoiceEditorTemplateId,
  accent = '#22c55e',
  snapEnabled = true,
): InvoiceEditorLayout {
  return {
    elements: presetElements(templateId, accent),
    accentColor: accent,
    snapEnabled,
    templateId,
    documentTitle: DEFAULT_DOCUMENT_TITLE,
  }
}

export function createDefaultElement(
  type: ElementType,
  accent: string,
  existing: PlacedElement[],
): PlacedElement {
  const size = DEFAULT_ELEMENT_SIZE[type]
  const maxY = existing.reduce((m, e) => Math.max(m, e.y + e.h), PAPER_MARGIN)
  const base: PlacedElement = {
    id: isMultiInstanceType(type)
      ? `${type}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`
      : `${type}-${Date.now()}`,
    type,
    x: PAPER_MARGIN,
    y: maxY + 16,
    w: size.w,
    h: size.h,
    align: type === 'business' || type === 'totals' ? 'right' : 'left',
    color: accent,
    locked: false,
    spacing: 12,
  }
  if (type === 'bodyText') {
    base.text = DEFAULT_BODY_TEXT
  }
  if (type === 'service') {
    base.serviceDescription = DEFAULT_SERVICE_DESCRIPTION
    base.serviceAmount = DEFAULT_SERVICE_AMOUNT
  }
  return base
}
