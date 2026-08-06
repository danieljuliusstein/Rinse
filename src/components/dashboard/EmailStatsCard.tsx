import { useMemo } from 'react'
import { IconClick, IconMailOpened, IconSend } from '@tabler/icons-react'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

type FunnelStage = {
  key: string
  label: string
  count: number
  Icon: typeof IconSend
}

type Props = {
  sent: number
  opened: number
  clicked?: number
  campaignCount: number
  onOpen?: () => void
}

export function EmailStatsCard({ sent, opened, clicked = 0, campaignCount, onOpen }: Props) {
  const stages: FunnelStage[] = useMemo(
    () => [
      { key: 'sent', label: 'Sent', count: sent, Icon: IconSend },
      { key: 'opened', label: 'Opened', count: opened, Icon: IconMailOpened },
      { key: 'clicked', label: 'Clicked', count: clicked, Icon: IconClick },
    ],
    [sent, opened, clicked],
  )

  const startCount = stages[0]?.count ?? 0
  const finalMuted = startCount > 0 && (stages[stages.length - 1]?.count ?? 0) / startCount < 0.5

  return (
    <WidgetCard onOpen={onOpen} className="w-full">
      <div className="flex justify-between shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Email Stats</p>
        <span className="text-xs text-gray-400">
          {campaignCount} campaign{campaignCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-center flex-1 min-h-0" onClick={stopCardClick}>
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1
          const muted = isLast && finalMuted
          const next = stages[i + 1]
          const conv =
            next && stage.count > 0 ? Math.round((next.count / stage.count) * 100) : next ? 0 : null
          const convColor =
            conv === null ? undefined : conv >= 70 ? '#16A34A' : conv >= 40 ? '#92400E' : '#B91C1C'
          const Icon = stage.Icon
          const tip =
            next && conv !== null
              ? `${stage.count} ${stage.label.toLowerCase()} → ${next.count} ${next.label.toLowerCase()} (${conv}%)`
              : `${stage.count} ${stage.label.toLowerCase()}`

          return (
            <div key={stage.key} className="contents">
              <Tip label={tip}>
                <button
                  type="button"
                  onClick={() => onOpen?.()}
                  className="flex flex-col items-center gap-1 flex-shrink-0 rounded-lg px-1 py-1 transition-transform hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-shadow"
                    style={{
                      background: muted ? '#F1EFE8' : '#CCFBF1',
                      color: muted ? '#5F5E5A' : '#0F766E',
                      boxShadow: muted ? undefined : '0 0 0 0 transparent',
                    }}
                  >
                    <Icon size={15} stroke={1.75} aria-hidden />
                  </div>
                  <span className="text-xs font-medium text-gray-900 tabular-nums">{stage.count}</span>
                  <span className="text-[10px] text-gray-400">{stage.label}</span>
                </button>
              </Tip>
              {next && (
                <div className="flex-1 self-start pt-2 px-1 text-center min-w-0">
                  <span className="text-[10px] font-medium" style={{ color: convColor ?? '#9CA3AF' }}>
                    {conv !== null ? `${conv}%` : '—'}
                  </span>
                  <div className="h-0.5 bg-gray-200 mt-1" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
