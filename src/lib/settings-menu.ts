import type { ComponentType } from 'react'
import {
  Bell,
  CalendarBlank,
  CreditCard,
  CurrencyDollar,
  Lifebuoy,
  Package,
  Receipt,
  Shield,
  Sparkle,
  Storefront,
  Trophy,
  UserCircle,
  Wallet,
  Wrench,
} from 'phosphor-react-native'

export type SettingsIconTone = 'green' | 'amber' | 'blue' | 'purple'

export interface SettingsMenuItem {
  id: string
  group: 'account' | 'business' | 'preferences' | 'management' | 'support'
  title: string
  subtitle: string
  href: string
  Icon: ComponentType<{ size?: number; color?: string; weight?: 'duotone' | 'regular' | 'fill' }>
  tone: SettingsIconTone
  searchKeys: string[]
}

export const SETTINGS_MENU_GROUPS = [
  { id: 'account', label: 'Account' },
  { id: 'business', label: 'Business' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'management', label: 'Management' },
  { id: 'support', label: 'Support' },
] as const

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: 'account',
    group: 'account',
    title: 'Account',
    subtitle: 'Email, password, and sign-in',
    href: '/settings/account',
    Icon: UserCircle,
    tone: 'purple',
    searchKeys: ['account', 'email', 'password', 'sign in', 'login', 'reset', 'forgot'],
  },
  {
    id: 'business',
    group: 'business',
    title: 'Your business',
    subtitle: 'Profile and online booking',
    href: '/settings/business',
    Icon: Storefront,
    tone: 'green',
    searchKeys: ['booking', 'logo', 'brand', 'business', 'company', 'phone', 'email', 'address', 'contact', 'profile'],
  },
  {
    id: 'schedule',
    group: 'business',
    title: 'Schedule & time off',
    subtitle: 'Hours, lunch, and blocked days',
    href: '/settings/schedule',
    Icon: CalendarBlank,
    tone: 'blue',
    searchKeys: ['hours', 'calendar', 'block', 'vacation', 'schedule', 'lunch', 'time off'],
  },
  {
    id: 'invoicing',
    group: 'business',
    title: 'Invoicing',
    subtitle: 'Online payments & invoice look',
    href: '/settings/invoicing',
    Icon: Receipt,
    tone: 'amber',
    searchKeys: [
      'terms',
      'footer',
      'invoice',
      'quote',
      'payments',
      'connect',
      'online pay',
      'template',
      'accent',
      'appearance',
      'preview',
      'customize',
    ],
  },
  {
    id: 'billing',
    group: 'business',
    title: 'Billing',
    subtitle: 'Plan, trial, and subscription',
    href: '/settings/billing',
    Icon: CreditCard,
    tone: 'green',
    searchKeys: ['billing', 'subscription', 'plan', 'trial', 'upgrade'],
  },
  {
    id: 'progress',
    group: 'preferences',
    title: 'Your progress',
    subtitle: 'Milestones from your business activity',
    href: '/settings/progress',
    Icon: Trophy,
    tone: 'green',
    searchKeys: ['progress', 'milestone', 'achievement', 'badge', 'stats'],
  },
  {
    id: 'preferences',
    group: 'preferences',
    title: 'App preferences',
    subtitle: 'Reminders and notifications',
    href: '/settings/preferences',
    Icon: Bell,
    tone: 'blue',
    searchKeys: ['notification', 'reminder', 'push', 'tour', 'walkthrough'],
  },
  {
    id: 'access',
    group: 'preferences',
    title: 'Access and data',
    subtitle: 'Backups, exports, and privacy',
    href: '/settings/access',
    Icon: Shield,
    tone: 'purple',
    searchKeys: ['backup', 'export', 'privacy', 'data', 'delete account'],
  },
  {
    id: 'inventory',
    group: 'management',
    title: 'Inventory',
    subtitle: 'Supplies and stock',
    href: '/inventory',
    Icon: Package,
    tone: 'amber',
    searchKeys: ['inventory', 'supplies', 'stock'],
  },
  {
    id: 'packages',
    group: 'management',
    title: 'Service packages',
    subtitle: 'Manage your offerings',
    href: '/settings/packages',
    Icon: Sparkle,
    tone: 'blue',
    searchKeys: ['packages', 'services', 'pricing'],
  },
  {
    id: 'invoices',
    group: 'management',
    title: 'All invoices',
    subtitle: 'Financial records',
    href: '/invoices',
    Icon: CurrencyDollar,
    tone: 'green',
    searchKeys: ['invoices', 'money', 'billing'],
  },
  {
    id: 'tools',
    group: 'management',
    title: 'Tools',
    subtitle: 'Shortcuts for invoices, expenses, and more',
    href: '/tools',
    Icon: Wrench,
    tone: 'blue',
    searchKeys: ['tools', 'hub', 'shortcuts', 'operations'],
  },
  {
    id: 'expenses',
    group: 'management',
    title: 'Expenses',
    subtitle: 'Overhead and business costs',
    href: '/settings/expenses',
    Icon: Wallet,
    tone: 'purple',
    searchKeys: ['expenses', 'overhead', 'business costs'],
  },
  {
    id: 'support',
    group: 'support',
    title: 'Help & support',
    subtitle: 'Contact, FAQ, and troubleshooting',
    href: '/settings/support',
    Icon: Lifebuoy,
    tone: 'blue',
    searchKeys: ['support', 'help', 'contact', 'faq', 'bug', 'feedback'],
  },
]

export function searchSettingsMenu(query: string): SettingsMenuItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return SETTINGS_MENU_ITEMS
  return SETTINGS_MENU_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.searchKeys.some((k) => k.includes(q))
  )
}
