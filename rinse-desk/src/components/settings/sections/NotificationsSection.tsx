import {
  Bell,
  BellRing,
  Sun,
  Clock,
  AlertTriangle,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardHeader, CardBody, Toggle } from '../primitives'
import type { DeskAppSettings } from '@/lib/settings-api'

type NotifKey = keyof DeskAppSettings['notifications']

type ToggleRow = {
  key: NotifKey
  label: string
  description: string
  icon: LucideIcon
  meta?: ReactNode
  channel: string
}

/** Labels aligned with mobile App preferences notification toggles. */
const ROWS: ToggleRow[] = [
  {
    key: 'job_reminder',
    label: 'Job reminder (day before)',
    description: 'Ping the day before each scheduled appointment.',
    icon: BellRing,
    channel: 'Push · day before',
  },
  {
    key: 'morning_reminder',
    label: 'Morning reminder',
    description: 'A daily digest of today’s jobs.',
    icon: Sun,
    channel: 'Push · morning',
  },
  {
    key: 'follow_up',
    label: 'Follow-up (3 days after)',
    description: 'Nudge when a customer is due for a re-book.',
    icon: Clock,
    channel: 'Email',
  },
  {
    key: 'invoice_overdue',
    label: 'Invoice overdue',
    description: 'Alert when an invoice passes its due date.',
    icon: AlertTriangle,
    channel: 'Email + Push',
  },
  {
    key: 'low_inventory',
    label: 'Low inventory',
    description: 'Warn when a stocked product runs low.',
    icon: Package,
    channel: 'Push',
  },
]

export function NotificationsSection({
  settings,
  setSettings,
}: {
  settings: DeskAppSettings
  setSettings: (patch: Partial<DeskAppSettings>) => void
}) {
  const activeCount = ROWS.filter((r) => settings.notifications[r.key]).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Notification preferences"
          description="Same toggles as mobile App preferences. Synced via app_settings.notifications."
          icon={<Bell size={16} />}
          accent
        />
        <CardBody>
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-ink-50/50 px-3.5 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[12px] font-bold text-white">
              {activeCount}
            </span>
            <p className="text-[12.5px] text-ink-500">
              <span className="font-medium text-ink-900">
                {activeCount} of {ROWS.length} on
              </span>{' '}
              · channel routing is per-device in mobile
            </p>
          </div>
          <div className="divide-y divide-ink-200">
            {ROWS.map((row) => {
              const on = settings.notifications[row.key]
              const Icon = row.icon
              return (
                <div key={row.key} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        on ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-400'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-medium text-ink-900">{row.label}</p>
                      <p className="text-[12.5px] leading-snug text-ink-500">{row.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${
                            on ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-500'
                          }`}
                        >
                          {row.channel}
                        </span>
                        {row.meta}
                      </div>
                    </div>
                  </div>
                  <Toggle
                    checked={on}
                    onChange={(v) =>
                      setSettings({
                        notifications: { ...settings.notifications, [row.key]: v },
                      })
                    }
                  />
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
