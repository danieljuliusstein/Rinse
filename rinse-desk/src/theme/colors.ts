/** Rinse operator tokens — match apps/mobile light theme */
export const colors = {
  green: '#22C55E',
  greenHover: '#16A34A',
  greenText: '#16A34A',
  greenSoft: '#EAF9EF',
  greenBorder: '#bbf7d0',
  greenDark: '#16A34A',
  bg: '#F4F5F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  borderSubtle: '#F0F1EE',
  teal: '#14b8a6',
  amber: '#f59e0b',
  blue: '#2563eb',
  danger: '#ef4444',
  sidebarFrom: '#0B1F14',
  sidebarTo: '#071407',
  sidebarActive: '#16301F',
  brandMark: '#22C55E',
} as const

/** Soft pastel avatar pairs — deterministic by seed (Contacts / Inbox) */
export const AVATAR_TONES = [
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#FCE7F3', fg: '#9D174D' },
] as const

export type AvatarTone = (typeof AVATAR_TONES)[number]

/** Contact identifier pill styles (Contacts table + Inbox details) */
export const IDENTIFIER_STYLES = {
  Account: { bg: '#DBEAFE', text: '#1E40AF' },
  Prospect: { bg: '#FEF3C7', text: '#92400E' },
  Type: { bg: '#E9D5FF', text: '#6B21A8' },
  Client: { bg: '#D1FAE5', text: '#065F46' },
} as const

export const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.blue,
  in_progress: colors.amber,
  completed: colors.teal,
  invoiced: colors.greenDark,
  paid: colors.green,
  draft: colors.textMuted,
  sent: colors.blue,
  overdue: colors.danger,
  inquiry: colors.green,
  quoted: colors.amber,
  booked: colors.teal,
  call: colors.green,
  email: colors.teal,
  meeting: colors.blue,
  other: colors.amber,
}
