import type { Icon } from '@/src/icons'
import {
  ChartLineUp,
  CurrencyDollar,
  FileText,
  Funnel,
  Package,
  PlusCircle,
  Receipt,
  Star,
  UsersThree,
  Wallet,
} from '@/src/icons'
import type { SettingsIconTone } from '@/src/lib/settings-menu'
import { SETTINGS_MENU_GROUPS, SETTINGS_MENU_ITEMS, type SettingsMenuItem } from '@/src/lib/settings-menu'
import { fmt } from '@rinse/core'

export type HubIcon = Icon

export type HubRow = {
  id: string
  title: string
  subtitle: string
  href: string
  Icon: HubIcon
  tone: SettingsIconTone
  searchKeys: string[]
}

export type HubSection = {
  id: string
  label: string
  rows: HubRow[]
}

export function reviewHubSubtitle(ratingAvg: number, reviewCount: number): string {
  if (reviewCount > 0 || ratingAvg > 0) {
    return `${ratingAvg} avg · ${reviewCount} reviews`
  }
  return 'Set rating & link'
}

export function invoicesHubSubtitle(unpaid: number, openCount: number): string {
  if (openCount <= 0) return 'No open balances'
  return `${fmt(unpaid)} unpaid · ${openCount} open`
}

/** Fixed hub rows above settings-menu mirror (Reports / Invoicing / Operations). */
export function buildPrimaryHubSections(opts: {
  reviewSubtitle: string
  invoicesSubtitle: string
}): HubSection[] {
  return [
    {
      id: 'reports',
      label: 'Reports',
      rows: [
        {
          id: 'revenue-payouts',
          title: 'Revenue & Payouts',
          subtitle: 'Monthly summaries, payouts',
          href: '/reports/pl',
          Icon: ChartLineUp,
          tone: 'green',
          searchKeys: ['revenue', 'payouts', 'profit', 'charts', 'p&l', 'reports'],
        },
        {
          id: 'reviews',
          title: 'Reviews',
          subtitle: opts.reviewSubtitle,
          href: '/settings/crm-extras',
          Icon: Star,
          tone: 'amber',
          searchKeys: ['reviews', 'rating', 'google', 'crm'],
        },
      ],
    },
    {
      id: 'invoicing',
      label: 'Invoicing',
      rows: [
        {
          id: 'hub-invoices',
          title: 'Invoices',
          subtitle: opts.invoicesSubtitle,
          href: '/(tabs)/invoices',
          Icon: Receipt,
          tone: 'green',
          searchKeys: ['invoices', 'ar', 'unpaid', 'billing'],
        },
        {
          id: 'hub-quotes',
          title: 'Quotes',
          subtitle: 'Estimates and proposals',
          href: '/(tabs)/quotes',
          Icon: FileText,
          tone: 'blue',
          searchKeys: ['quotes', 'estimates'],
        },
        {
          id: 'hub-expenses',
          title: 'Expenses',
          subtitle: 'Receipts, job costs, overhead',
          href: '/settings/expenses',
          Icon: Wallet,
          tone: 'purple',
          searchKeys: ['expenses', 'overhead', 'costs', 'receipts', 'scan'],
        },
        {
          id: 'policies',
          title: 'Deposit & Cancel Policy',
          subtitle: 'Deposits, cancel window, tips',
          href: '/settings/policies',
          Icon: CurrencyDollar,
          tone: 'amber',
          searchKeys: ['deposit', 'cancel', 'policy', 'tips'],
        },
        {
          id: 'addons',
          title: 'Add-on Catalog',
          subtitle: 'Extra line items for jobs',
          href: '/settings/addons',
          Icon: PlusCircle,
          tone: 'blue',
          searchKeys: ['addons', 'add-ons', 'extras', 'catalog'],
        },
        {
          id: 'hub-invoicing-settings',
          title: 'Payments & invoice look',
          subtitle: 'Stripe Connect, templates',
          href: '/settings/invoicing',
          Icon: Receipt,
          tone: 'amber',
          searchKeys: ['stripe', 'connect', 'invoice look', 'templates'],
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      rows: [
        {
          id: 'hub-pipeline',
          title: 'Pipeline',
          subtitle: 'Leads and follow-ups',
          href: '/(tabs)/pipeline',
          Icon: Funnel,
          tone: 'blue',
          searchKeys: ['pipeline', 'leads', 'crm'],
        },
        {
          id: 'hub-inventory',
          title: 'Inventory',
          subtitle: 'Supplies and equipment',
          href: '/(tabs)/inventory',
          Icon: Package,
          tone: 'amber',
          searchKeys: ['inventory', 'supplies', 'stock'],
        },
        {
          id: 'hub-team',
          title: 'Team',
          subtitle: 'Technicians and roster',
          href: '/settings/team',
          Icon: UsersThree,
          tone: 'green',
          searchKeys: ['team', 'tech', 'roster', 'operators'],
        },
      ],
    },
  ]
}

export function settingsMenuAsHubSections(
  items: Array<SettingsMenuItem & { title: string; subtitle: string }>,
  groupLabels: Record<string, string>,
): HubSection[] {
  return SETTINGS_MENU_GROUPS.map((g) => ({
    id: `settings-${g.id}`,
    label: groupLabels[g.id] ?? g.id,
    rows: items
      .filter((item) => item.group === g.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href,
        Icon: item.Icon,
        tone: item.tone,
        searchKeys: item.searchKeys,
      })),
  })).filter((s) => s.rows.length > 0)
}

export function filterHubSections(sections: HubSection[], query: string): HubSection[] {
  const q = query.trim().toLowerCase()
  if (!q) return sections
  return sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter(
        (row) =>
          row.title.toLowerCase().includes(q) ||
          row.subtitle.toLowerCase().includes(q) ||
          row.searchKeys.some((k) => k.includes(q)),
      ),
    }))
    .filter((s) => s.rows.length > 0)
}

export { SETTINGS_MENU_ITEMS }
