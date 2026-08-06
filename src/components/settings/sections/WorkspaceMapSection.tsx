import {
  LayoutGrid,
  ArrowUpRight,
  Smartphone,
  LifeBuoy,
  Inbox,
  Receipt,
  Route,
  Users,
  Shield,
  CreditCard,
  Building2,
  CalendarClock,
  Sliders,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '../primitives'
import type { SectionId } from '../types'
import type { PageId } from '@/lib/types'

type Badge = 'Open' | 'Mobile only'

type MapRow = {
  id: string
  label: string
  badge: Badge
  note?: string
  icon: LucideIcon
  action?: { type: 'section'; id: SectionId } | { type: 'page'; id: PageId }
}

type MapGroup = {
  name: string
  rows: MapRow[]
}

const GROUPS: MapGroup[] = [
  {
    name: 'Account',
    rows: [
      {
        id: 'account',
        label: 'Account',
        badge: 'Open',
        note: 'Session, refresh, sign out',
        icon: Shield,
        action: { type: 'section', id: 'account' },
      },
      {
        id: 'billing',
        label: 'Billing & plan',
        badge: 'Mobile only',
        note: 'Subscription management',
        icon: CreditCard,
      },
    ],
  },
  {
    name: 'Business',
    rows: [
      {
        id: 'business',
        label: 'Business profile',
        badge: 'Open',
        note: 'This tab → Business profile',
        icon: Building2,
        action: { type: 'section', id: 'business' },
      },
      {
        id: 'schedule',
        label: 'Schedule',
        badge: 'Open',
        note: 'This tab → Schedule',
        icon: CalendarClock,
        action: { type: 'section', id: 'schedule' },
      },
      {
        id: 'preferences',
        label: 'Preferences',
        badge: 'Open',
        note: 'This tab → Preferences',
        icon: Sliders,
        action: { type: 'section', id: 'preferences' },
      },
      {
        id: 'notifications',
        label: 'Notifications',
        badge: 'Open',
        note: 'This tab → Notifications',
        icon: Bell,
        action: { type: 'section', id: 'notifications' },
      },
      {
        id: 'team',
        label: 'Team & roles',
        badge: 'Mobile only',
        note: 'Technician roster',
        icon: Users,
      },
    ],
  },
  {
    name: 'Management',
    rows: [
      {
        id: 'pipeline',
        label: 'Deals pipeline',
        badge: 'Open',
        note: 'Deals tab',
        icon: LayoutGrid,
        action: { type: 'page', id: 'deals' },
      },
      {
        id: 'messages',
        label: 'Inbox',
        badge: 'Open',
        note: 'Inbox tab',
        icon: Inbox,
        action: { type: 'page', id: 'chat' },
      },
      {
        id: 'expenses',
        label: 'Receipts',
        badge: 'Open',
        note: 'Money tab',
        icon: Receipt,
        action: { type: 'page', id: 'receipts' },
      },
      {
        id: 'routes',
        label: 'Routes depot',
        badge: 'Open',
        note: 'Set via Business address here',
        icon: Route,
        action: { type: 'page', id: 'routes' },
      },
    ],
  },
  {
    name: 'Support',
    rows: [
      {
        id: 'support',
        label: 'Help center',
        badge: 'Open',
        note: 'Help article browser',
        icon: LifeBuoy,
        action: { type: 'page', id: 'help' },
      },
      {
        id: 'contact-support',
        label: 'Contact support',
        badge: 'Mobile only',
        note: 'In-app chat on mobile',
        icon: LifeBuoy,
      },
    ],
  },
]

function BadgePill({ badge }: { badge: Badge }) {
  if (badge === 'Open') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
        Open
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-500">
      <Smartphone size={10} />
      Mobile only
    </span>
  )
}

export function WorkspaceMapSection({
  onNavigate,
}: {
  onNavigate: (action: NonNullable<MapRow['action']>) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Where things live"
          description="A map of Rinse surfaces — what opens here vs. elsewhere."
          icon={<LayoutGrid size={16} />}
          accent
        />
        <CardBody className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.name}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                {group.name}
              </p>
              <div className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200">
                {group.rows.map((row) => {
                  const open = row.badge === 'Open' && row.action
                  const Icon = row.icon
                  const inner = (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink-900">{row.label}</p>
                          {row.note && (
                            <p className="truncate text-[12px] text-ink-500">{row.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <BadgePill badge={row.badge} />
                        {open && (
                          <ArrowUpRight
                            size={14}
                            className="text-ink-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
                          />
                        )}
                      </div>
                    </>
                  )

                  if (open && row.action) {
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => onNavigate(row.action!)}
                        className="group flex w-full items-center justify-between gap-3 bg-white px-3.5 py-3 text-left transition-colors duration-150 hover:bg-ink-50/50"
                      >
                        {inner}
                      </button>
                    )
                  }

                  return (
                    <div
                      key={row.id}
                      className="group flex items-center justify-between gap-3 bg-white px-3.5 py-3 opacity-70"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
      <p className="px-1 text-[12px] text-ink-500">
        Calendar time-off, Routes optimization, and the full inventory editor are separate tabs —
        not duplicated here.
      </p>
    </div>
  )
}
