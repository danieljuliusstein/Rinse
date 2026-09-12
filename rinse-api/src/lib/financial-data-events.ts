export const FINANCIAL_DATA_CHANGED = 'financial-data-changed'

export function notifyFinancialDataChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(FINANCIAL_DATA_CHANGED))
}
