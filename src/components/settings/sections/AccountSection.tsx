import {
  UserCog,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Users,
  CalendarDays,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Divider } from '../primitives'
import { RinseLogo } from '@/components/brand/RinseLogo'
import { BRAND } from '@/lib/brand-assets'

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={16} />
      </span>
      <div>
        <span className="block text-[20px] font-semibold leading-none text-ink-900">
          {value.toLocaleString()}
        </span>
        <span className="mt-1 block text-[12px] text-ink-500">{label}</span>
      </div>
    </div>
  )
}

export function AccountSection({
  email,
  workspaceName,
  contacts,
  events,
  deals,
  onRefresh,
  refreshing,
  onSignOut,
}: {
  email: string
  workspaceName: string
  contacts: number
  events: number
  deals: number
  onRefresh: () => void
  refreshing: boolean
  onSignOut: () => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Signed in as" icon={<UserCog size={16} />} accent />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-200/80">
              <RinseLogo size={32} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink-900">{email}</p>
              <p className="text-[12px] text-ink-500">
                {BRAND.product}
                {workspaceName ? ` · ${workspaceName}` : ''}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Active
            </span>
          </div>
          <Divider />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Contacts" value={contacts} icon={Users} />
            <Stat label="Events" value={events} icon={CalendarDays} />
            <Stat label="Deals" value={deals} icon={TrendingUp} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Data" description="Re-pull your workspace data from PocketBase." />
        <CardBody>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[13px] font-medium text-ink-900 transition-all duration-150 hover:border-ink-300 hover:bg-ink-100 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-settings-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </CardBody>
      </Card>

      <Card className="border-red-200">
        <CardHeader
          title="Danger zone"
          description="Ends this desktop session. Data stays in your organization."
          icon={<ShieldAlert size={16} />}
        />
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-ink-900">Sign out of desktop</p>
              <p className="text-[12px] text-ink-500">Ends this session on this browser only.</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
