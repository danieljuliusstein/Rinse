export type ElementType =
  | 'logo'
  | 'business'
  | 'meta'
  | 'lineItems'
  | 'totals'
  | 'notes'
  | 'bodyText'
  | 'service'

/** Types that may appear more than once on a layout. */
export const MULTI_INSTANCE_TYPES: readonly ElementType[] = ['bodyText', 'service']

export function isMultiInstanceType(type: ElementType): boolean {
  return type === 'bodyText' || type === 'service'
}

export type ElementAlign = 'left' | 'center' | 'right'

export type InvoiceEditorTemplateId = 'rinse' | 'classic' | 'minimal'

export interface PlacedElement {
  id: string
  type: ElementType
  x: number
  y: number
  w: number
  h: number
  align: ElementAlign
  color: string
  locked: boolean
  /** Vertical gap after this block when used in flow contexts. */
  spacing?: number
  /** Custom body paragraph (`bodyText`). */
  text?: string
  /** Custom service row (`service`). */
  serviceDescription?: string
  serviceAmount?: number
}

export interface InvoiceEditorLayout {
  elements: PlacedElement[]
  accentColor: string
  snapEnabled: boolean
  templateId: InvoiceEditorTemplateId
  /** Document heading on the meta block — e.g. Invoice, Tax Invoice, Receipt. */
  documentTitle?: string
}

export type SnapAxis = 'x' | 'y'

export interface SnapGuide {
  axis: SnapAxis
  position: number
  active: boolean
}

export interface SnapResult {
  x: number
  y: number
  guides: SnapGuide[]
}

/** Dashed slot shown while dragging — where the block will land in the stack. */
export interface DropGhost {
  x: number
  y: number
  w: number
  h: number
}

export interface EditorPreviewData {
  businessName: string
  businessEmail: string
  businessAddress: string
  businessPhone: string
  logoUrl?: string | null
  invoiceNumber: string
  statusLabel: string
  lineItems: { description: string; amount: number }[]
  subtotal: number
  total: number
  balanceDue: number
  termsFooter: string
}
