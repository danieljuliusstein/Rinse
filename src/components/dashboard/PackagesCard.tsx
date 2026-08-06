import { useMemo, type MouseEvent } from 'react'
import {
  IconBrush,
  IconDroplet,
  IconPencil,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react'
import { money } from '@/lib/metrics'
import type { DeskPackage } from '@/lib/types'
import { colors } from '@/theme/colors'
import { WidgetCard } from './widgetUi'

const PACKAGE_LOOKS = [
  { bg: '#E6F1FB', fg: '#0C447C', Icon: IconDroplet },
  { bg: '#EEEDFE', fg: '#3C3489', Icon: IconShieldCheck },
  { bg: '#FAEEDA', fg: '#854F0B', Icon: IconSparkles },
  { bg: '#E1F5EE', fg: '#085041', Icon: IconBrush },
] as const

type Props = {
  packages: DeskPackage[]
  onEdit: (pkg: DeskPackage) => void
  onArchive: (pkg: DeskPackage) => void
  onCreate: () => void
}

export function PackagesCard({ packages, onEdit, onArchive, onCreate }: Props) {
  const rows = useMemo(() => {
    const list = packages.length
      ? [...packages].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
      : ([{ name: 'No packages yet', base_price: 0, active: false, id: 'x' }] as DeskPackage[])
    return list.slice(0, 4)
  }, [packages])

  const activeCount = packages.filter((p) => p.active).length || packages.length

  function stop(e: MouseEvent, fn: () => void) {
    e.stopPropagation()
    fn()
  }

  return (
    <WidgetCard className="!p-3">
      <div className="flex justify-between shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Packages</p>
        <span className="text-xs text-gray-400">{activeCount} active</span>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 mt-1.5 flex-1 min-h-0 min-w-0">
        {rows.map((pkg, i) => {
          const look = PACKAGE_LOOKS[i % PACKAGE_LOOKS.length]!
          const Icon = look.Icon
          const empty = pkg.id === 'x'
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onEdit(pkg)}
              className="relative group border rounded-[8px] px-1.5 py-1 text-left min-h-0 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm hover:border-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-green-200 flex items-center gap-1.5"
              style={{ borderColor: '#F0F1EE' }}
            >
              <div
                className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-transform group-hover:scale-105 shrink-0"
                style={{ background: look.bg }}
              >
                <Icon size={12} color={look.fg} stroke={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <div className="text-[11px] font-medium text-gray-900 truncate leading-tight">{pkg.name}</div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  {empty ? 'Create one' : money(pkg.base_price)}
                </div>
              </div>

              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <span
                  role="button"
                  tabIndex={0}
                  title="Edit package"
                  onClick={(e) => stop(e, () => onEdit(pkg))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      stop(e as unknown as MouseEvent, () => onEdit(pkg))
                    }
                  }}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                >
                  <IconPencil size={11} stroke={1.75} aria-hidden />
                </span>
                {!empty && pkg.active && (
                  <span
                    role="button"
                    tabIndex={0}
                    title="Archive package"
                    onClick={(e) => stop(e, () => onArchive(pkg))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        stop(e as unknown as MouseEvent, () => onArchive(pkg))
                      }
                    }}
                    className="p-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-50"
                  >
                    <IconTrash size={11} stroke={1.75} aria-hidden />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onCreate()}
        className="w-full mt-1.5 text-[11px] text-white rounded-lg py-1 hover:brightness-95 active:scale-[0.98] transition-all shrink-0"
        style={{ background: colors.green }}
      >
        + New package
      </button>
    </WidgetCard>
  )
}
