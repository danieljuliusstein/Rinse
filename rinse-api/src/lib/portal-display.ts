import { formatInvoiceMoney } from './invoice-layout'

export function portalMoney(amount: number): string {
  return formatInvoiceMoney(amount)
}

export function portalInvoiceBadgeClass(status: string): string {
  const map: Record<string, string> = {
    paid: 'portal-badge--paid',
    sent: 'portal-badge--sent',
    overdue: 'portal-badge--overdue',
    draft: 'portal-badge--draft',
    partial: 'portal-badge--partial',
  }
  return `portal-badge ${map[status] ?? 'portal-badge--draft'}`
}

export function portalQuoteBadgeClass(status: string): string {
  if (status === 'accepted') return 'portal-badge portal-badge--accepted'
  if (status === 'sent') return 'portal-badge portal-badge--sent'
  if (status === 'expired' || status === 'declined') return 'portal-badge portal-badge--overdue'
  return 'portal-badge portal-badge--draft'
}

export function portalBalancePanelClass(status: string, balanceDue: number): 'danger' | 'warning' | null {
  if (balanceDue <= 0) return null
  if (status === 'overdue') return 'danger'
  return 'warning'
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function parsePortalDay(dateStr: string): Date | null {
  const day = (dateStr?.trim() || '').split('T')[0]
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const d = new Date(`${day}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatPortalDate(dateStr: string): string {
  const d = parsePortalDay(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatPortalDateShort(dateStr: string): string {
  const d = parsePortalDay(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
