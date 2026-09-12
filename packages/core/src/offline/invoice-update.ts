import type { Invoice } from '../types'

export type InvoiceUpdate = Partial<
  Pick<
    Invoice,
    | 'discount_amount'
    | 'tax_rate'
    | 'po_number'
    | 'terms'
    | 'notes'
    | 'signature_url'
    | 'signed_at'
    | 'extra_line_items'
    | 'subtotal'
  >
>
