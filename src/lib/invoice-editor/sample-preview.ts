import type { EditorPreviewData } from './types'

export function createEditorPreviewData(overrides?: Partial<EditorPreviewData>): EditorPreviewData {
  return {
    businessName: 'Summit Detailing',
    businessEmail: 'hello@summitdetail.com',
    businessAddress: 'Atlanta, GA',
    businessPhone: '(404) 555-0192',
    invoiceNumber: 'DET-2026-03-001',
    statusLabel: 'Sent',
    lineItems: [
      { description: 'Full detail package', amount: 180 },
      { description: 'Ceramic add-on', amount: 95 },
    ],
    subtotal: 275,
    total: 275,
    balanceDue: 275,
    termsFooter: 'Thanks for choosing Summit Detailing.',
    ...overrides,
  }
}
