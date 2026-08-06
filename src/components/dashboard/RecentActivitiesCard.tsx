import {
  IconCalendar,
  IconMail,
  IconNote,
  IconPhone,
} from '@tabler/icons-react'
import type { ActivityType, DeskActivity } from '@/lib/types'
import { EmptyState } from '@/components/graphics/SoftBlobs'
import { colors, STATUS_COLORS } from '@/theme/colors'
import { WidgetCard } from './widgetUi'

const ACTIVITY_NODE: Record<ActivityType, { bg: string; fg: string; Icon: typeof IconMail }> = {
  email: { bg: '#CCFBF1', fg: '#0F766E', Icon: IconMail },
  call: { bg: '#EAF9EF', fg: '#16A34A', Icon: IconPhone },
  meeting: { bg: '#DBEAFE', fg: '#1E40AF', Icon: IconCalendar },
  note: { bg: '#FAEEDA', fg: '#854F0B', Icon: IconNote },
}

type Props = {
  activities: DeskActivity[]
  loading?: boolean
  contactName: (id: string) => string
  formatWhen: (iso: string) => string
  onViewAll: () => void
  onNew: () => void
  onOpenActivity?: (activity: DeskActivity) => void
}

export function RecentActivitiesCard({
  activities,
  loading,
  contactName,
  formatWhen,
  onViewAll,
  onNew,
  onOpenActivity,
}: Props) {
  return (
    <WidgetCard>
      <div className="flex justify-between items-center shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Recent Activities</p>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium hover:underline outline-none focus-visible:underline"
          style={{ color: colors.greenText }}
        >
          View all
        </button>
      </div>

      <div className="relative mt-2 pl-7 flex-1 min-h-0 overflow-y-auto overflow-x-clip no-scrollbar">
        {activities.length > 0 && (
          <div className="absolute left-[11px] top-1.5 bottom-1.5 w-0.5" style={{ background: '#F0F1EE' }} />
        )}

        {loading && <p className="text-xs text-gray-400 py-2">Loading…</p>}
        {!loading && activities.length === 0 && (
          <EmptyState scene="activity" compact title="No recent activity" description="Log a call, email, or note to get started" />
        )}

        {activities.map((a, i) => {
          const tone = ACTIVITY_NODE[a.type] ?? ACTIVITY_NODE.note
          const Icon = tone.Icon
          const tagColor = STATUS_COLORS[a.type] ?? colors.amber
          const isLast = i === activities.length - 1
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpenActivity?.(a) ?? onViewAll()}
              className={`relative w-full text-left rounded-lg px-1 transition-colors hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-green-200 ${isLast ? '' : 'pb-2.5'}`}
            >
              <div
                className="absolute -left-7 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: tone.bg, color: tone.fg }}
              >
                <Icon size={10} stroke={2} aria-hidden />
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{a.subject}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {contactName(a.contact_id)} · {formatWhen(a.occurred_at)}
                  </div>
                </div>
                <span
                  className="text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 capitalize"
                  style={{ background: tagColor }}
                >
                  {a.type}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2 shrink-0">
        <button
          type="button"
          onClick={onViewAll}
          className="flex-1 text-xs text-green-700 border border-green-200 rounded-lg py-1.5 hover:bg-green-50 transition-colors"
        >
          View All
        </button>
        <button
          type="button"
          onClick={onNew}
          className="flex-1 text-xs text-white rounded-lg py-1.5 hover:brightness-95 active:scale-[0.98] transition-all"
          style={{ background: colors.green }}
        >
          + New
        </button>
      </div>
    </WidgetCard>
  )
}
