import type { JobWithRelations } from '@rinse/core'

export type JobDetailSection =
  | 'progress'
  | 'payments'
  | 'photos'
  | 'communication'
  | 'billing'

export type JobDetailPrimaryAction =
  | 'on_my_way'
  | 'timer_toggle'
  | 'create_invoice'
  | 'open_invoice'
  | 'share_pay_link'
  | 'mark_complete'

export interface JobDetailPriority {
  guidanceHeading: string
  expandedSection: JobDetailSection | null
  primaryAction: JobDetailPrimaryAction | null
  primaryLabel: string | null
  hideActions: boolean
}

export function jobDetailPriority(
  job: JobWithRelations,
  opts: { hasInvoice: boolean; timerRunning?: boolean },
): JobDetailPriority {
  const { hasInvoice, timerRunning = false } = opts

  if (job.status === 'cancelled') {
    return {
      guidanceHeading: 'Actions unavailable for this job',
      expandedSection: null,
      primaryAction: null,
      primaryLabel: null,
      hideActions: true,
    }
  }

  if (job.status === 'scheduled') {
    return {
      guidanceHeading: 'Ready for your pre-arrival checklist',
      expandedSection: 'communication',
      primaryAction: 'on_my_way',
      primaryLabel: 'On my way',
      hideActions: false,
    }
  }

  if (job.status === 'in_progress') {
    return {
      guidanceHeading: 'Keep the job moving from one place',
      expandedSection: 'progress',
      primaryAction: 'timer_toggle',
      primaryLabel: timerRunning ? 'Pause timer' : 'Start timer',
      hideActions: false,
    }
  }

  if (job.status === 'paid') {
    return {
      guidanceHeading: 'Payment received — share portal or tip link',
      expandedSection: 'payments',
      primaryAction: 'share_pay_link',
      primaryLabel: 'Share Pay Link / Tip',
      hideActions: false,
    }
  }

  if (job.status === 'completed' || job.status === 'invoiced') {
    if (hasInvoice) {
      return {
        guidanceHeading: 'Invoice ready — send or collect payment',
        expandedSection: 'billing',
        primaryAction: 'open_invoice',
        primaryLabel: 'View invoice',
        hideActions: false,
      }
    }
    return {
      guidanceHeading: 'Wrap up payment and send the client portal',
      expandedSection: 'billing',
      primaryAction: 'create_invoice',
      primaryLabel: 'Create invoice',
      hideActions: false,
    }
  }

  return {
    guidanceHeading: 'Review job details',
    expandedSection: 'progress',
    primaryAction: null,
    primaryLabel: null,
    hideActions: false,
  }
}

export function paymentsAccordionHint(job: JobWithRelations, depositDueAmount: number): string {
  if (job.deposit_status === 'paid') {
    const amt = job.deposit_amount ?? depositDueAmount
    return `$${amt.toFixed(0)} deposit collected`
  }
  if (job.deposit_status === 'waived') return 'Deposit waived'
  if (job.deposit_status === 'due' || depositDueAmount > 0) {
    return `$${depositDueAmount.toFixed(0)} deposit`
  }
  return 'Payments & tips'
}

export function photosAccordionHint(before: number, after: number): string {
  return `${before} before · ${after} after`
}
