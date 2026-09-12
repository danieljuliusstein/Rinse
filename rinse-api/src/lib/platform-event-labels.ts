export const PLATFORM_EVENT_LABELS: Record<string, string> = {
  org_created: 'Org created',
  onboarding_step_viewed: 'Onboarding step viewed',
  onboarding_step_completed: 'Onboarding step completed',
  onboarding_completed: 'Onboarding completed',
  setup_intro_slide_viewed: 'Setup intro slide viewed',
  admin_org_updated: 'Admin org updated',
  admin_backup_triggered: 'Full backup downloaded',
  auth_failure: 'Auth failure',
  webhook_reject: 'Webhook rejected',
  subscription_status_changed: 'Subscription updated',
  invoice_payment_failed: 'Invoice payment failed',
}

export function formatPlatformEventLabel(type: string): string {
  return PLATFORM_EVENT_LABELS[type] ?? type.replace(/_/g, ' ')
}

export function formatPlatformEventTime(iso: string): string {
  if (!iso?.trim()) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
