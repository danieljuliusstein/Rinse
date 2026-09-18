// ---------------------------------------------------------------------------
// data/types.ts — TOUR-FACING VIEW MODELS (adapted from live Desk records)
// ---------------------------------------------------------------------------
//
// Live source: useData() → adapters → TourDataProvider. Stops/pages read Desk
// directly for mutations; these shapes are for counts / agent overlay only.
// ---------------------------------------------------------------------------

/** A person you detail for. Real source: DeskClient -> useData().clients. */
export interface TourContact {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

/** Pipeline stage for a deal. Real source: DeskLead.stage. */
export type DealStage = "inquiry" | "quoted" | "booked"

/**
 * A sales opportunity. Real source: DeskLead -> useData().leads, rendered by
 * SalesPipeline.tsx. `service` is a tour-only display extra (documented) — the
 * real pipeline derives the line item from the quote.
 */
export interface TourDeal {
  id: string
  name: string
  phone?: string
  email?: string
  stage: DealStage
  vehicle_type?: string
  value?: number
  service?: string
}

/** Invoice lifecycle. Real source: DeskInvoice.status. */
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"

/** A bill for completed work. Real source: DeskInvoice -> useData().invoices. */
export interface TourInvoice {
  id: string
  clientName: string
  amount: number
  status: InvoiceStatus
  service?: string
}

/** A vehicle attached to a client. Real source: DeskVehicle -> useData().vehicles. */
export interface TourVehicle {
  id: string
  client_id: string
  year?: number
  make: string
  model: string
  type?: string
}

/** Which mock/live path the data layer is currently serving. */
export type DataMode = "mock" | "live-ready"
