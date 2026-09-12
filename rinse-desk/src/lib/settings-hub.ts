/** Desk settings hub — mirrors mobile Business / settings discovery (read-only links). */
export type SettingsGroupId = 'account' | 'business' | 'preferences' | 'management' | 'support'

export type SettingsRow = {
  id: string
  group: SettingsGroupId
  title: string
  subtitle: string
}

export const SETTINGS_GROUPS: { id: SettingsGroupId; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'business', label: 'Business' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'management', label: 'Management' },
  { id: 'support', label: 'Support' },
]

export const SETTINGS_ROWS: SettingsRow[] = [
  { id: 'account', group: 'account', title: 'Account', subtitle: 'Email, password, sign-in' },
  { id: 'business', group: 'business', title: 'Business profile', subtitle: 'Logo, booking link, brand' },
  { id: 'schedule', group: 'business', title: 'Schedule', subtitle: 'Work days, hours, buffers' },
  { id: 'invoicing', group: 'business', title: 'Payments & invoices', subtitle: 'Invoice templates' },
  { id: 'email-domain', group: 'business', title: 'Email domain', subtitle: 'SPF / DKIM checklist' },
  { id: 'billing', group: 'business', title: 'Billing', subtitle: 'Plan & subscription' },
  { id: 'policies', group: 'business', title: 'Deposit & cancel policy', subtitle: 'Deposits, tips, no-show' },
  { id: 'addons', group: 'business', title: 'Add-on catalog', subtitle: 'Extra line items' },
  { id: 'team', group: 'business', title: 'Team', subtitle: 'Technician roster' },
  { id: 'expenses', group: 'business', title: 'Expenses', subtitle: 'Receipts & overhead' },
  { id: 'preferences', group: 'preferences', title: 'Preferences', subtitle: 'Defaults & display' },
  { id: 'quiet-hours', group: 'preferences', title: 'Quiet hours', subtitle: 'SMS send windows' },
  { id: 'language', group: 'preferences', title: 'Language', subtitle: 'EN / ES customer docs' },
  { id: 'crm-extras', group: 'preferences', title: 'CRM extras', subtitle: 'Reviews & extras' },
  { id: 'progress', group: 'preferences', title: 'Progress', subtitle: 'Milestones' },
  { id: 'inventory', group: 'management', title: 'Inventory', subtitle: 'Supplies & stock' },
  { id: 'pipeline', group: 'management', title: 'Pipeline', subtitle: 'Deals board' },
  { id: 'messages', group: 'management', title: 'Inbox', subtitle: 'Chat threads & folders' },
  { id: 'support', group: 'support', title: 'Support', subtitle: 'Help & FAQ' },
  { id: 'privacy', group: 'support', title: 'Privacy', subtitle: 'Policies' },
]
