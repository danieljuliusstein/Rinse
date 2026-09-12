import type { Icon } from '@/src/icons'
import {
  Bell,
  CalendarBlank,
  CreditCard,
  CurrencyDollar,
  EnvelopeSimple,
  Lifebuoy,
  MoonStars,
  Package,
  Receipt,
  Shield,
  Sparkle,
  Storefront,
  Translate,
  Trophy,
  UserCircle,
  Wallet,
  Wrench,
} from '@/src/icons'
import i18n from '@/src/i18n'

export type SettingsIconTone = 'green' | 'amber' | 'blue' | 'purple'

export interface SettingsMenuItem {
  id: string
  group: 'account' | 'business' | 'preferences' | 'management' | 'support'
  titleKey: string
  subtitleKey: string
  href: string
  Icon: Icon
  tone: SettingsIconTone
  searchKeys: string[]
}

export const SETTINGS_MENU_GROUPS = [
  { id: 'account' as const, labelKey: 'settings.groups.account' },
  { id: 'business' as const, labelKey: 'settings.groups.business' },
  { id: 'preferences' as const, labelKey: 'settings.groups.preferences' },
  { id: 'management' as const, labelKey: 'settings.groups.management' },
  { id: 'support' as const, labelKey: 'settings.groups.support' },
]

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: 'account',
    group: 'account',
    titleKey: 'settings.menu.account.title',
    subtitleKey: 'settings.menu.account.subtitle',
    href: '/settings/account',
    Icon: UserCircle,
    tone: 'purple',
    searchKeys: ['account', 'email', 'password', 'sign in', 'login', 'cuenta', 'correo'],
  },
  {
    id: 'business',
    group: 'business',
    titleKey: 'settings.menu.business.title',
    subtitleKey: 'settings.menu.business.subtitle',
    href: '/settings/business',
    Icon: Storefront,
    tone: 'green',
    searchKeys: ['booking', 'logo', 'brand', 'business', 'company', 'negocio', 'perfil'],
  },
  {
    id: 'schedule',
    group: 'business',
    titleKey: 'settings.menu.schedule.title',
    subtitleKey: 'settings.menu.schedule.subtitle',
    href: '/settings/schedule',
    Icon: CalendarBlank,
    tone: 'blue',
    searchKeys: ['hours', 'calendar', 'block', 'vacation', 'schedule', 'horario'],
  },
  {
    id: 'invoicing',
    group: 'business',
    titleKey: 'settings.menu.invoicing.title',
    subtitleKey: 'settings.menu.invoicing.subtitle',
    href: '/settings/invoicing',
    Icon: Receipt,
    tone: 'amber',
    searchKeys: ['invoice', 'quote', 'payments', 'connect', 'factura', 'cotización'],
  },
  {
    id: 'email-domain',
    group: 'business',
    titleKey: 'settings.menu.emailDomain.title',
    subtitleKey: 'settings.menu.emailDomain.subtitle',
    href: '/settings/email-domain',
    Icon: EnvelopeSimple,
    tone: 'blue',
    searchKeys: ['email', 'spf', 'dkim', 'dmarc', 'resend', 'domain', 'spam', 'dns'],
  },
  {
    id: 'billing',
    group: 'business',
    titleKey: 'settings.menu.billing.title',
    subtitleKey: 'settings.menu.billing.subtitle',
    href: '/settings/billing',
    Icon: CreditCard,
    tone: 'green',
    searchKeys: ['billing', 'subscription', 'plan', 'trial', 'upgrade', 'suscripción'],
  },
  {
    id: 'progress',
    group: 'preferences',
    titleKey: 'settings.menu.progress.title',
    subtitleKey: 'settings.menu.progress.subtitle',
    href: '/settings/progress',
    Icon: Trophy,
    tone: 'green',
    searchKeys: ['progress', 'milestone', 'achievement', 'progreso'],
  },
  {
    id: 'preferences',
    group: 'preferences',
    titleKey: 'settings.menu.preferences.title',
    subtitleKey: 'settings.menu.preferences.subtitle',
    href: '/settings/preferences',
    Icon: Bell,
    tone: 'blue',
    searchKeys: ['notification', 'reminder', 'push', 'tour', 'preferencias'],
  },
  {
    id: 'language',
    group: 'preferences',
    titleKey: 'settings.menu.language.title',
    subtitleKey: 'settings.menu.language.subtitle',
    href: '/settings/language',
    Icon: Translate,
    tone: 'blue',
    searchKeys: [
      'language',
      'idioma',
      'locale',
      'i18n',
      'english',
      'spanish',
      'español',
      'chinese',
      '中文',
      'hindi',
      'french',
      'arabic',
      'portuguese',
      'russian',
      'german',
      'japanese',
      'korean',
      'italian',
      'vietnamese',
      'turkish',
      'indonesian',
      'bengali',
      'urdu',
    ],
  },
  {
    id: 'quiet-hours',
    group: 'preferences',
    titleKey: 'settings.menu.quietHours.title',
    subtitleKey: 'settings.menu.quietHours.subtitle',
    href: '/settings/quiet-hours',
    Icon: MoonStars,
    tone: 'purple',
    searchKeys: ['quiet', 'hours', 'timezone', 'silencio', 'noche'],
  },
  {
    id: 'access',
    group: 'preferences',
    titleKey: 'settings.menu.access.title',
    subtitleKey: 'settings.menu.access.subtitle',
    href: '/settings/access',
    Icon: Shield,
    tone: 'purple',
    searchKeys: ['backup', 'export', 'privacy', 'data', 'datos'],
  },
  {
    id: 'inventory',
    group: 'management',
    titleKey: 'settings.menu.inventory.title',
    subtitleKey: 'settings.menu.inventory.subtitle',
    href: '/inventory',
    Icon: Package,
    tone: 'amber',
    searchKeys: ['inventory', 'supplies', 'stock', 'inventario'],
  },
  {
    id: 'packages',
    group: 'management',
    titleKey: 'settings.menu.packages.title',
    subtitleKey: 'settings.menu.packages.subtitle',
    href: '/settings/packages',
    Icon: Sparkle,
    tone: 'blue',
    searchKeys: ['packages', 'services', 'pricing', 'paquetes'],
  },
  {
    id: 'invoices',
    group: 'management',
    titleKey: 'settings.menu.invoices.title',
    subtitleKey: 'settings.menu.invoices.subtitle',
    href: '/invoices',
    Icon: CurrencyDollar,
    tone: 'green',
    searchKeys: ['invoices', 'money', 'billing', 'facturas'],
  },
  {
    id: 'tools',
    group: 'management',
    titleKey: 'settings.menu.tools.title',
    subtitleKey: 'settings.menu.tools.subtitle',
    href: '/tools',
    Icon: Wrench,
    tone: 'blue',
    searchKeys: ['tools', 'hub', 'shortcuts', 'herramientas'],
  },
  {
    id: 'expenses',
    group: 'management',
    titleKey: 'settings.menu.expenses.title',
    subtitleKey: 'settings.menu.expenses.subtitle',
    href: '/settings/expenses',
    Icon: Wallet,
    tone: 'purple',
    searchKeys: ['expenses', 'overhead', 'gastos'],
  },
  {
    id: 'support',
    group: 'support',
    titleKey: 'settings.menu.support.title',
    subtitleKey: 'settings.menu.support.subtitle',
    href: '/settings/support',
    Icon: Lifebuoy,
    tone: 'blue',
    searchKeys: ['support', 'help', 'contact', 'faq', 'ayuda'],
  },
]

export function searchSettingsMenu(query: string): SettingsMenuItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return SETTINGS_MENU_ITEMS
  return SETTINGS_MENU_ITEMS.filter((item) => {
    const title = i18n.t(item.titleKey).toLowerCase()
    const subtitle = i18n.t(item.subtitleKey).toLowerCase()
    return (
      title.includes(q) ||
      subtitle.includes(q) ||
      item.searchKeys.some((k) => k.includes(q))
    )
  })
}
