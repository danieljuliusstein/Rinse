import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import {
  CalendarBlank,
  ChatCircle,
  CurrencyDollar,
  FileText,
  Funnel,
  Package,
  Receipt,
  Shield,
  Wallet,
  Wrench,
} from '@phosphor-icons/react'
import type { SettingsIconTone } from './settings-menu'

export interface ToolsMenuItem {
  id: string
  title: string
  subtitle: string
  href: string
  Icon: PhosphorIcon
  tone: SettingsIconTone
}

export const TOOLS_MENU_ITEMS: ToolsMenuItem[] = [
  {
    id: 'pipeline',
    title: 'Pipeline',
    subtitle: 'Leads and booking stages',
    href: '/pipeline',
    Icon: Funnel,
    tone: 'blue',
  },
  {
    id: 'quotes',
    title: 'Quotes',
    subtitle: 'Estimates and proposals',
    href: '/quotes',
    Icon: FileText,
    tone: 'blue',
  },
  {
    id: 'messages',
    title: 'Messages',
    subtitle: 'Auto messages and follow-ups',
    href: '/messages',
    Icon: ChatCircle,
    tone: 'purple',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    subtitle: 'Business costs and overhead',
    href: '/settings/expenses',
    Icon: Wallet,
    tone: 'purple',
  },
  {
    id: 'invoices',
    title: 'All invoices',
    subtitle: 'Search, filter, and send',
    href: '/invoices',
    Icon: Receipt,
    tone: 'green',
  },
  {
    id: 'new-invoice',
    title: 'Create invoice',
    subtitle: 'Pick a job without an invoice',
    href: '/invoices/new',
    Icon: CurrencyDollar,
    tone: 'amber',
  },
  {
    id: 'inventory',
    title: 'Inventory',
    subtitle: 'Supplies and stock',
    href: '/inventory',
    Icon: Package,
    tone: 'amber',
  },
  {
    id: 'schedule',
    title: 'Schedule',
    subtitle: 'Hours and blocked days',
    href: '/settings/schedule',
    Icon: CalendarBlank,
    tone: 'blue',
  },
  {
    id: 'access',
    title: 'Import & export',
    subtitle: 'Backups and data',
    href: '/settings/access',
    Icon: Shield,
    tone: 'purple',
  },
  {
    id: 'invoicing',
    title: 'Invoice settings',
    subtitle: 'Template, Stripe, and terms',
    href: '/settings/invoicing',
    Icon: Wrench,
    tone: 'blue',
  },
]
