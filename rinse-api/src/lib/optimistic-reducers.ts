import type { Invoice, InvoiceStatus, JobWithRelations, LeadStage, LeadWithRelations, Supply } from '@/lib/types'

export type InvoiceOptimisticAction =
  | { type: 'markSent'; id: string }
  | { type: 'markPaid'; id: string }
  | { type: 'remove'; id: string }

export function optimisticInvoiceReducer(state: Invoice[], action: InvoiceOptimisticAction): Invoice[] {
  const today = new Date().toISOString().slice(0, 10)
  switch (action.type) {
    case 'markSent':
      return state.map((inv) =>
        inv.id === action.id
          ? {
              ...inv,
              status: 'sent' as InvoiceStatus,
              sent_at: today,
            }
          : inv,
      )
    case 'markPaid':
      return state.map((inv) =>
        inv.id === action.id
          ? {
              ...inv,
              status: 'paid' as InvoiceStatus,
              balance_due: 0,
              amount_paid: inv.total,
              paid_at: today,
            }
          : inv,
      )
    case 'remove':
      return state.filter((inv) => inv.id !== action.id)
    default:
      return state
  }
}

export type LeadOptimisticAction =
  | { type: 'stage'; id: string; stage: LeadStage }
  | { type: 'remove'; id: string }

export function optimisticLeadReducer(
  state: LeadWithRelations[],
  action: LeadOptimisticAction,
): LeadWithRelations[] {
  switch (action.type) {
    case 'stage':
      return state.map((lead) => (lead.id === action.id ? { ...lead, stage: action.stage } : lead))
    case 'remove':
      return state.filter((lead) => lead.id !== action.id)
    default:
      return state
  }
}

export type JobOptimisticAction = { type: 'status'; id: string; status: JobWithRelations['status'] }

export function optimisticJobReducer(
  state: JobWithRelations,
  action: JobOptimisticAction,
): JobWithRelations {
  if (state.id !== action.id) return state
  return { ...state, status: action.status }
}

export type SupplyOptimisticAction = {
  type: 'restock'
  id: string
  quantity: number
}

export function optimisticSupplyReducer(state: Supply[], action: SupplyOptimisticAction): Supply[] {
  switch (action.type) {
    case 'restock':
      return state.map((s) =>
        s.id === action.id ? { ...s, quantity_on_hand: s.quantity_on_hand + action.quantity } : s,
      )
    default:
      return state
  }
}
