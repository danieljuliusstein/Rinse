// ---------------------------------------------------------------------------
// adapters.ts — Desk record → tour view models
// ---------------------------------------------------------------------------

import type {
  DealStage,
  InvoiceStatus,
  TourContact,
  TourDeal,
  TourInvoice,
  TourVehicle,
} from './types'

type Raw = Record<string, unknown>

const str = (v: unknown, fallback = ''): string => (v == null ? fallback : String(v))
const numOr = (v: unknown): number | undefined =>
  typeof v === 'number' ? v : v == null ? undefined : Number(v) || undefined
const optStr = (v: unknown): string | undefined => (v == null ? undefined : String(v))

export function fromDeskClient(client: TourContact | Raw): TourContact {
  const c = client as Raw
  return {
    id: str(c.id),
    name: str(c.name),
    phone: optStr(c.phone),
    email: optStr(c.email),
    address: optStr(c.address),
    notes: optStr(c.notes),
  }
}

export function fromDeskLead(lead: TourDeal | Raw): TourDeal {
  const l = lead as Raw
  const stage = str(l.stage, 'inquiry') as DealStage
  return {
    id: str(l.id),
    name: str(l.name),
    phone: optStr(l.phone),
    email: optStr(l.email),
    stage: (['inquiry', 'quoted', 'booked'] as const).includes(stage) ? stage : 'inquiry',
    vehicle_type: optStr(l.vehicle_type),
    value: numOr(l.value ?? l.quote_amount),
    service: optStr(l.service ?? l.service_interest),
  }
}

export function fromDeskInvoice(invoice: TourInvoice | Raw): TourInvoice {
  const i = invoice as Raw
  const status = str(i.status, 'draft') as InvoiceStatus
  const allowed = (['draft', 'sent', 'paid', 'overdue'] as const).includes(
    status as 'draft' | 'sent' | 'paid' | 'overdue',
  )
  return {
    id: str(i.id ?? i.invoice_number),
    clientName: str(i.clientName ?? i.client_name ?? i.client),
    amount: numOr(i.amount ?? i.total) ?? 0,
    status: allowed ? (status as InvoiceStatus) : 'draft',
    service: optStr(i.service),
  }
}

export function fromDeskVehicle(vehicle: TourVehicle | Raw): TourVehicle {
  const v = vehicle as Raw
  return {
    id: str(v.id),
    client_id: str(v.client_id ?? v.clientId),
    year: numOr(v.year),
    make: str(v.make),
    model: str(v.model),
    type: optStr(v.type),
  }
}

export const adaptClients = (list: Array<TourContact | Raw> = []): TourContact[] =>
  list.map(fromDeskClient)
export const adaptLeads = (list: Array<TourDeal | Raw> = []): TourDeal[] => list.map(fromDeskLead)
export const adaptInvoices = (list: Array<TourInvoice | Raw> = []): TourInvoice[] =>
  list.map(fromDeskInvoice)
export const adaptVehicles = (list: Array<TourVehicle | Raw> = []): TourVehicle[] =>
  list.map(fromDeskVehicle)
