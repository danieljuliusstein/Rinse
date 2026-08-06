import { Search, Plus, SlidersHorizontal, AlertCircle } from 'lucide-react'
import { FLEET_TYPES, TYPE_META } from '@/components/cars/VehicleTypeModels'
import type { DeskVehicle, VehicleType } from '@/lib/types'
import { colors } from '@/theme/colors'

export type FleetSort = 'name' | 'damage' | 'type'

type Props = {
  vehicles: DeskVehicle[]
  allVehicles: DeskVehicle[]
  selectedId: string | null
  onSelect: (id: string) => void
  query: string
  onQuery: (q: string) => void
  typeFilter: VehicleType | 'all'
  onTypeFilter: (t: VehicleType | 'all') => void
  sort: FleetSort
  onSortCycle: () => void
  damageCounts: Record<string, number>
  clientName: (clientId: string) => string
  onAddVehicle: () => void
  paintFor: (v: DeskVehicle) => string
}

function vehicleLabel(v: DeskVehicle): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'
}

export function FleetList({
  vehicles,
  allVehicles,
  selectedId,
  onSelect,
  query,
  onQuery,
  typeFilter,
  onTypeFilter,
  sort,
  onSortCycle,
  damageCounts,
  clientName,
  onAddVehicle,
  paintFor,
}: Props) {
  const filters: { id: VehicleType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    ...FLEET_TYPES.map((t) => ({ id: t, label: TYPE_META[t].label })),
  ]

  const sortLabel =
    sort === 'name' ? 'Name' : sort === 'damage' ? 'Damage' : 'Type'

  return (
    <aside className="w-[340px] shrink-0 h-full flex flex-col bg-white border-r border-ink-200">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-ink-900 tracking-tight">Cars</h1>
            <p className="text-[12px] text-ink-500">
              {allVehicles.length} vehicle{allVehicles.length === 1 ? '' : 's'} in fleet
            </p>
          </div>
          <button
            type="button"
            onClick={onAddVehicle}
            className="w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors flex items-center justify-center shadow-sm shadow-brand-500/30"
            aria-label="Add vehicle"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search make, model, client, plate…"
            className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-ink-100 rounded-lg border border-transparent focus:border-brand-400 focus:bg-white focus:outline-none transition-colors placeholder:text-ink-400"
          />
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filters.map(({ id, label }) => {
            const count =
              id === 'all'
                ? allVehicles.length
                : allVehicles.filter((v) => v.type === id).length
            const active = typeFilter === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTypeFilter(id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {label}
                <span
                  className={`text-[10px] tabular-nums ${active ? 'text-white/60' : 'text-ink-400'}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Fleet
          {vehicles.length !== allVehicles.length ? ` · ${vehicles.length}` : ''}
        </span>
        <button
          type="button"
          onClick={onSortCycle}
          className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-700"
          title="Cycle sort"
        >
          <SlidersHorizontal className="w-3 h-3" />
          Sort · {sortLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-3 pb-4 space-y-1">
        {vehicles.length === 0 ? (
          <p className="text-xs text-ink-400 p-3">
            {allVehicles.length === 0 ? 'No vehicles in this org yet' : 'No matches'}
          </p>
        ) : (
          vehicles.map((v) => {
            const isSel = selectedId === v.id
            const damage = damageCounts[v.id] ?? 0
            const flagged = damage > 0
            const paint = paintFor(v)
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  isSel
                    ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-400/30'
                    : 'bg-white border-transparent hover:bg-ink-50 hover:border-ink-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg border border-ink-200 shadow-inner"
                      style={{ background: paint }}
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        flagged ? 'bg-rust-500' : 'bg-brand-500'
                      }`}
                      title={flagged ? 'Needs review' : 'Clear'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink-900 truncate">
                      {vehicleLabel(v)}
                    </div>
                    <div className="text-[12px] text-ink-500 truncate">
                      {clientName(v.client_id) || 'No client'}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-ink-100 text-ink-600">
                        {TYPE_META[v.type]?.label ?? v.type}
                      </span>
                      {damage > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-rust-600">
                          <AlertCircle className="w-3 h-3" />
                          {damage} damage
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-400">No damage logged</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

export function paintHexFor(v: DeskVehicle | null): string {
  if (!v) return colors.green
  const hex = v.color_hex?.trim()
  if (hex && /^#?[0-9a-fA-F]{3,8}$/.test(hex)) {
    return hex.startsWith('#') ? hex : `#${hex}`
  }
  return colors.green
}
