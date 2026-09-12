export type HomeModuleId =
  | 'cta_row'
  | 'ar_alert'
  | 'job_readiness'
  | 'invoice_month_carousel'
  | 'revenue_chart'
  | 'month_calendar'
  | 'today_jobs'
  | 'upcoming'
  | 'inventory_alert'

export interface HomeModuleDef {
  id: HomeModuleId
  label: string
  description: string
  defaultOn: boolean
}

export const HOME_MODULES: HomeModuleDef[] = [
  { id: 'cta_row', label: 'Quick actions', description: 'New job and create invoice buttons', defaultOn: true },
  { id: 'ar_alert', label: 'Open invoices alert', description: 'Unpaid balance summary', defaultOn: true },
  {
    id: 'job_readiness',
    label: 'Job readiness',
    description: 'Weather risk for outdoor (mobile) jobs in the next 3 days',
    defaultOn: true,
  },
  {
    id: 'invoice_month_carousel',
    label: 'Collected invoices carousel',
    description: 'Month-by-month paid invoice totals',
    defaultOn: false,
  },
  {
    id: 'revenue_chart',
    label: 'Revenue chart',
    description: 'Service mix donut for recent jobs',
    defaultOn: false,
  },
  { id: 'month_calendar', label: 'Month calendar', description: 'Full month job calendar', defaultOn: true },
  { id: 'today_jobs', label: "Today's jobs", description: 'Jobs scheduled for today', defaultOn: true },
  { id: 'upcoming', label: 'Upcoming jobs', description: 'Next scheduled appointments', defaultOn: true },
  { id: 'inventory_alert', label: 'Low inventory alert', description: 'Supplies running low', defaultOn: true },
]

export type HomeModulePrefs = Partial<Record<HomeModuleId, boolean>>

export function isHomeModuleEnabled(prefs: HomeModulePrefs | undefined, id: HomeModuleId): boolean {
  if (prefs && id in prefs) return prefs[id] !== false
  const def = HOME_MODULES.find((m) => m.id === id)
  return def?.defaultOn ?? true
}
