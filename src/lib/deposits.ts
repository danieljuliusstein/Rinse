import type { BusinessPolicies } from '@rinse/core'

export function computeDepositDue(policies: BusinessPolicies, revenue: number): number {
  if (policies.deposit_mode === 'fixed') return Math.max(0, Number(policies.deposit_value) || 0)
  const pct = Number(policies.deposit_value) || 0
  return Math.round(((revenue * pct) / 100) * 100) / 100
}

export function depositBadgeTone(
  status: string | undefined,
): 'amber' | 'green' | 'gray' | null {
  if (!status || status === 'none') return null
  if (status === 'due') return 'amber'
  if (status === 'paid') return 'green'
  if (status === 'waived') return 'gray'
  return null
}

export function depositBadgeLabel(status: string | undefined): string | null {
  if (!status || status === 'none') return null
  if (status === 'due') return 'Deposit due'
  if (status === 'paid') return 'Deposit paid'
  if (status === 'waived') return 'Deposit waived'
  return null
}
