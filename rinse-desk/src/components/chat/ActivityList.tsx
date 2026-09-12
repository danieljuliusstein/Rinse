import type { DeskActivity, DeskClient } from '@/lib/types'
import { colors } from '@/theme/colors'
import { avatarTone, formatThreadTime, initialsFromName } from './chatUtils'

type Props = {
  title: string
  activities: DeskActivity[]
  clients: DeskClient[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  createLabel: string
}

export function ActivityList({
  title,
  activities,
  clients,
  selectedId,
  onSelect,
  onCreate,
  createLabel,
}: Props) {
  function contactName(id: string) {
    return clients.find((c) => c.id === id)?.name ?? 'Unknown'
  }

  const sorted = [...activities].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))

  return (
    <aside
      className="flex flex-col h-full border-r bg-white min-w-0"
      style={{ borderColor: colors.border }}
    >
      <div
        className="p-3 flex items-center justify-between gap-2"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <p className="text-xs font-semibold text-gray-800">{title}</p>
        <button
          type="button"
          onClick={onCreate}
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white transition-opacity hover:opacity-90"
          style={{ background: colors.green }}
        >
          {createLabel}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {sorted.length === 0 && <p className="text-[11px] text-gray-400 p-4">Nothing here yet</p>}
        {sorted.map((a) => {
          const name = contactName(a.contact_id)
          const selected = selectedId === a.id
          const tone = avatarTone(a.contact_id || a.id)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`w-full flex gap-2.5 px-3 py-2.5 text-left border-l-[3px] ${
                selected ? '' : 'border-l-transparent hover:bg-gray-50'
              }`}
              style={
                selected
                  ? { background: colors.greenSoft, borderLeftColor: colors.green }
                  : undefined
              }
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {initialsFromName(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                  <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                    {formatThreadTime(a.occurred_at)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-700 truncate mt-0.5">{a.subject}</p>
                {a.body && <p className="text-[10px] text-gray-400 truncate">{a.body}</p>}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
