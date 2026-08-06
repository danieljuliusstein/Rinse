import type { LucideIcon } from 'lucide-react'
import { Car, Droplets, Fuel, Package, ShieldCheck, SprayCan, Wrench } from 'lucide-react'

export type KnownExpenseCategory =
  | 'Supplies'
  | 'Chemicals'
  | 'Fuel'
  | 'Insurance'
  | 'Tools'
  | 'Equipment'

export const EXPENSE_CATEGORIES: KnownExpenseCategory[] = [
  'Supplies',
  'Chemicals',
  'Fuel',
  'Insurance',
  'Tools',
  'Equipment',
]

export const CATEGORY_META: Record<
  KnownExpenseCategory | 'Other',
  { icon: LucideIcon; tint: string; text: string; ring: string }
> = {
  Supplies: {
    icon: SprayCan,
    tint: 'bg-brand-100',
    text: 'text-brand-700',
    ring: 'ring-brand-200',
  },
  Chemicals: {
    icon: Droplets,
    tint: 'bg-sky-100',
    text: 'text-sky-700',
    ring: 'ring-sky-200',
  },
  Fuel: {
    icon: Fuel,
    tint: 'bg-amber-100',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  Insurance: {
    icon: ShieldCheck,
    tint: 'bg-violet-100',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
  },
  Tools: {
    icon: Wrench,
    tint: 'bg-rose-100',
    text: 'text-rose-700',
    ring: 'ring-rose-200',
  },
  Equipment: {
    icon: Car,
    tint: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-200',
  },
  Other: {
    icon: Package,
    tint: 'bg-ink-100',
    text: 'text-ink-600',
    ring: 'ring-ink-200',
  },
}

export function resolveCategoryMeta(category?: string) {
  const trimmed = category?.trim()
  if (!trimmed) return { key: 'Other' as const, label: 'Uncategorized', ...CATEGORY_META.Other }
  const known = EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase())
  if (known) return { key: known, label: known, ...CATEGORY_META[known] }
  return { key: 'Other' as const, label: trimmed, ...CATEGORY_META.Other }
}

export function formatReceiptDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatReceiptDateLong(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
