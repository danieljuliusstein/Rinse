export type ElementType = 'logo' | 'business' | 'meta' | 'lineItems' | 'totals' | 'notes'

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
