import { useMemo, useState } from 'react'
import { IconUser } from '@tabler/icons-react'
import { IDENTIFIERS, readIdentifier, type ContactIdentifier } from '@/lib/contact-identifier'
import { initials } from '@/lib/metrics'
import type { DeskClient } from '@/lib/types'
import { AVATAR_TONES, colors, IDENTIFIER_STYLES } from '@/theme/colors'
import { Tip, WidgetCard, stopCardClick } from './widgetUi'

const PICTOGRAM_MAX = 12

const LABEL_LOOK: Record<ContactIdentifier, { bg: string; fg: string; swatch: string }> = {
  Prospect: { bg: '#FAEEDA', fg: '#854F0B', swatch: '#EF9F27' },
  Client: { bg: '#EAF9EF', fg: '#16A34A', swatch: '#22C55E' },
  Account: { bg: '#E6F1FB', fg: '#0C447C', swatch: '#378ADD' },
  Type: { bg: '#EEEDFE', fg: '#3C3489', swatch: '#7F77DD' },
}

/** Source bar colors — distinct from label swatches above. */
const SOURCE_COLORS = ['#1D9E75', '#2a78d6', '#7F77DD', '#E24B4A', '#D97706', '#0F766E'] as const

type Props = {
  clients: DeskClient[]
  onOpen?: () => void
  onOpenLabel?: (label: ContactIdentifier) => void
  onOpenContact?: (id: string) => void
}

function formatSourceLabel(raw: string | undefined): string {
  const spaced = (raw ?? '').replace(/_/g, ' ').trim()
  if (!spaced) return 'Other'
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatShortDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ContactsByLabelCard({ clients, onOpen, onOpenLabel, onOpenContact }: Props) {
  const [hoverLabel, setHoverLabel] = useState<ContactIdentifier | null>(null)

  const { rows, icons, total, sources, recent } = useMemo(() => {
    const counts: Record<ContactIdentifier, number> = {
      Client: 0,
      Account: 0,
      Prospect: 0,
      Type: 0,
    }
    const byLabel: ContactIdentifier[] = []
    const sourceCounts = new Map<string, number>()

    for (const c of clients) {
      const id = readIdentifier(c)
      counts[id] += 1
      byLabel.push(id)
      const source = formatSourceLabel(c.lead_source)
      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1)
    }

    const total = clients.length
    const rows = IDENTIFIERS.map((name) => ({
      name,
      value: counts[name],
      pct: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
      ...LABEL_LOOK[name],
    })).filter((r) => r.value > 0)

    const sources = [...sourceCounts.entries()]
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .map((s, i) => ({ ...s, color: SOURCE_COLORS[i % SOURCE_COLORS.length]! }))

    const recent = [...clients]
      .map((c, i) => ({
        client: c,
        avatarTone: AVATAR_TONES[i % AVATAR_TONES.length]!,
      }))
      .sort((a, b) => (b.client.created || '').localeCompare(a.client.created || ''))
      .slice(0, 2)

    return { rows, icons: byLabel, total, sources, recent }
  }, [clients])

  const usePictogram = total > 0 && total <= PICTOGRAM_MAX

  function goLabel(label: ContactIdentifier) {
    onOpenLabel?.(label) ?? onOpen?.()
  }

  return (
    <WidgetCard onOpen={onOpen} className="w-full">
      <div className="flex justify-between shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Contacts by Label</p>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col">
      {usePictogram ? (
        <div className="flex flex-wrap gap-1 shrink-0" onClick={stopCardClick}>
          {icons.map((label, i) => {
            const look = LABEL_LOOK[label]
            const dim = hoverLabel != null && hoverLabel !== label
            return (
              <Tip key={`${label}-${i}`} label={label}>
                <button
                  type="button"
                  onMouseEnter={() => setHoverLabel(label)}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => goLabel(label)}
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  style={{
                    background: look.bg,
                    opacity: dim ? 0.35 : 1,
                    transform: hoverLabel === label ? 'scale(1.15)' : undefined,
                  }}
                >
                  <IconUser size={11} color={look.fg} stroke={1.75} aria-hidden />
                </button>
              </Tip>
            )
          })}
        </div>
      ) : (
        <div className="space-y-0.5 shrink-0" onClick={stopCardClick}>
          {(rows.length
            ? rows
            : IDENTIFIERS.map((name) => ({
                name,
                value: 0,
                pct: 0,
                ...LABEL_LOOK[name],
              }))
          ).map((r) => (
            <button
              key={r.name}
              type="button"
              onMouseEnter={() => setHoverLabel(r.name)}
              onMouseLeave={() => setHoverLabel(null)}
              onClick={() => goLabel(r.name)}
              className="flex w-full items-center justify-between text-xs rounded-md px-1.5 py-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-200"
              style={{ background: hoverLabel === r.name ? `${r.swatch}18` : undefined }}
            >
              <span className="text-gray-700 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: r.swatch }} />
                {r.name}
              </span>
              <span className="text-gray-900">
                {r.pct}% · {r.value}
              </span>
            </button>
          ))}
        </div>
      )}

      {usePictogram && (
        <div className="flex flex-col gap-0.5 mt-1.5 shrink-0" onClick={stopCardClick}>
          {rows.map((r) => (
            <button
              key={r.name}
              type="button"
              onMouseEnter={() => setHoverLabel(r.name)}
              onMouseLeave={() => setHoverLabel(null)}
              onClick={() => goLabel(r.name)}
              className="flex justify-between text-xs rounded-md px-1.5 py-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-200"
              style={{ background: hoverLabel === r.name ? `${r.swatch}18` : undefined }}
            >
              <span className="text-gray-700 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: r.swatch }} />
                {r.name}
              </span>
              <span className="text-gray-900">
                {r.pct}% · {r.value}
              </span>
            </button>
          ))}
          {rows.length === 0 && <p className="text-xs text-gray-400">No contacts yet</p>}
        </div>
      )}

      <div className="h-px bg-[#F0F1EE] my-1.5 shrink-0" />

      <div className="shrink-0" onClick={stopCardClick}>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">By Source</p>
        {sources.length === 0 ? (
          <p className="text-xs text-gray-400">No sources yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {sources.slice(0, 3).map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-[#374151] truncate">{s.name}</span>
                  <span className="text-[#111827] shrink-0">
                    {s.pct}% · {s.value}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#F1EFE8] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-[#F0F1EE] my-1.5 shrink-0" />

      <div className="flex-1 min-h-0 overflow-hidden" onClick={stopCardClick}>
        <div className="flex justify-between items-center mb-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Recently Added</p>
          <button
            type="button"
            onClick={() => onOpen?.()}
            className="text-xs font-medium hover:underline outline-none focus-visible:underline"
            style={{ color: colors.greenText }}
          >
            View all →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-gray-400">No contacts yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {recent.map(({ client, avatarTone }) => {
              const label = readIdentifier(client)
              const pill = IDENTIFIER_STYLES[label]
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => onOpenContact?.(client.id) ?? onOpen?.()}
                  className="flex w-full items-center gap-2 text-left rounded-md px-1 py-0.5 transition-colors hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-green-200"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-medium"
                    style={{ background: avatarTone.bg, color: avatarTone.fg }}
                  >
                    {initials(client.name)}
                  </div>
                  <span className="flex-1 min-w-0 text-[12px] font-medium text-[#111827] truncate">
                    {client.name}
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                    style={{ background: pill.bg, color: pill.text }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400 w-12 text-right flex-shrink-0">
                    {formatShortDate(client.created)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </WidgetCard>
  )
}
