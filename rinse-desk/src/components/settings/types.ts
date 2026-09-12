import {
  Building2,
  CalendarClock,
  Sliders,
  Bell,
  UserCog,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import type { SettingsSectionId } from '@/providers/DeskNavProvider'

export type SectionId = SettingsSectionId

export type NavItem = {
  id: SectionId
  label: string
  icon: LucideIcon
  group: 'Business' | 'Preferences' | 'Account'
  keywords: string[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'business',
    label: 'Business profile',
    icon: Building2,
    group: 'Business',
    keywords: ['name', 'phone', 'email', 'address', 'depot', 'invoice', 'footer', 'template', 'brand'],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarClock,
    group: 'Business',
    keywords: [
      'hours',
      'work days',
      'lunch',
      'break',
      'slot',
      'interval',
      'buffer',
      'drive time',
      'arrival window',
      'max jobs',
      'open dates',
      'travel',
      'mileage',
      'rate',
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Sliders,
    group: 'Business',
    keywords: ['timezone', 'quiet hours', 'language', 'supplies', 'locale', 'document'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    group: 'Preferences',
    keywords: [
      'reminders',
      'morning',
      'follow-ups',
      'overdue',
      'invoices',
      'low inventory',
      'alerts',
      'job reminder',
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserCog,
    group: 'Account',
    keywords: ['email', 'session', 'sign out', 'data', 'counts', 'contacts', 'events', 'deals', 'refresh'],
  },
  {
    id: 'workspace',
    label: 'Workspace map',
    icon: LayoutGrid,
    group: 'Account',
    keywords: ['links', 'help', 'inbox', 'deals', 'receipts', 'navigation', 'mobile only', 'pipeline'],
  },
]

export const GROUP_ORDER: NavItem['group'][] = ['Business', 'Preferences', 'Account']

export type SectionMeta = {
  title: string
  subtitle: string
  hasSave: boolean
}

export const SECTION_META: Record<SectionId, SectionMeta> = {
  business: {
    title: 'Business profile',
    subtitle: 'How customers and invoices see your shop.',
    hasSave: true,
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Work days, hours, and booking buffers.',
    hasSave: true,
  },
  preferences: {
    title: 'Preferences',
    subtitle: 'Timezone, quiet hours, language, and rates.',
    hasSave: true,
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'What Rinse pings you about, and when.',
    hasSave: true,
  },
  account: {
    title: 'Account',
    subtitle: 'Your signed-in session and workspace data.',
    hasSave: false,
  },
  workspace: {
    title: 'Workspace map',
    subtitle: 'Where each part of Rinse lives.',
    hasSave: false,
  },
}
