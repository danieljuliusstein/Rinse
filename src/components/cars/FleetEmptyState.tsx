import type { ReactNode } from 'react'
import { ArrowRight, MapPin, Camera, ShieldCheck, Wrench } from 'lucide-react'
import carTopView from '@/assets/car-top-view.png'
import { FLEET_TYPES, TYPE_META } from '@/components/cars/VehicleTypeModels'
import { CAR_MAP_PINS } from '@/lib/car-map-pins'
import type { DeskJob, DeskVehicle, VehicleType } from '@/lib/types'
import { paintHexFor } from '@/components/cars/FleetList'

type Props = {
  vehicles: DeskVehicle[]
  jobs: DeskJob[]
  damageCounts: Record<string, number>
  clientName: (clientId: string) => string
  onPick: (id: string) => void
}

function vehicleLabel(v: DeskVehicle): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'
}

function startOfWeekISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function FleetEmptyState({
  vehicles,
  jobs,
  damageCounts,
  clientName,
  onPick,
}: Props) {
  const totalDamage = Object.values(damageCounts).reduce((s, n) => s + n, 0)
  const flagged = vehicles.filter((v) => (damageCounts[v.id] ?? 0) > 0).length
  const weekStart = startOfWeekISO()
  const jobsThisWeek = jobs.filter((j) => j.date >= weekStart).length

  const typeMix = FLEET_TYPES.map((t) => ({
    label: TYPE_META[t].label,
    count: vehicles.filter((v) => v.type === t).length,
    hex: t === 'sedan' ? '#4A4F49' : t === 'suv' ? '#22C55E' : '#9CA39A',
    type: t as VehicleType,
  })).filter((t) => t.count > 0)

  const total = vehicles.length || 1
  const suggested = [...vehicles]
    .sort((a, b) => (damageCounts[b.id] ?? 0) - (damageCounts[a.id] ?? 0))
    .slice(0, 3)

  const sampleMarked = CAR_MAP_PINS.filter((_, i) => i % 7 === 0).slice(0, 3).map((p) => p.id)

  return (
    <div className="flex-1 min-h-0 h-full overflow-hidden bg-ink-100 flex flex-col">
      <div className="flex-1 min-h-0 max-w-[1080px] w-full mx-auto px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[12px] text-ink-400 shrink-0">
          <span className="font-medium text-ink-600">Cars</span>
          <span>/</span>
          <span>Fleet overview</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center shrink-0">
          <div className="animate-cars-fade-up min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[11px] font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-cars-pin-pulse" />
              {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} ready for review
            </div>
            <h1 className="text-[26px] leading-[1.15] font-bold text-ink-900 tracking-tight mb-2">
              Pick a vehicle to review its{' '}
              <span className="text-brand-600">damage documentation.</span>
            </h1>
            <p className="text-[13px] text-ink-500 leading-snug max-w-[440px] mb-3">
              Field techs tap body-area dots on mobile. Here you review pins, open photos, and fill
              job-photo gaps from the desk.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {vehicles[0] ? (
                <button
                  type="button"
                  onClick={() => onPick(vehicles[0]!.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-white text-[13px] font-medium transition-colors"
                >
                  Open first vehicle
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
              <span className="text-[12px] text-ink-400">or pick from the list on the left</span>
            </div>
          </div>

          <div className="relative animate-cars-pop-in justify-self-center shrink-0 hidden sm:block">
            <div className="relative w-[120px] h-[180px] bg-white rounded-xl border border-ink-200 shadow-card p-2 flex items-center justify-center overflow-hidden">
              <img
                src={carTopView}
                alt=""
                className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-contain pointer-events-none"
                draggable={false}
              />
              {CAR_MAP_PINS.filter((p) => sampleMarked.includes(p.id)).map((pin) => (
                <span
                  key={pin.id}
                  className="absolute w-2.5 h-2.5 rounded-full bg-rust-500 border-2 border-white shadow-sm"
                  style={{ left: `${pin.left}%`, top: `${pin.top}%`, marginLeft: -5, marginTop: -5 }}
                />
              ))}
            </div>
            <div className="mt-2 text-center text-[10px] font-medium text-ink-500">
              Bird&apos;s-eye damage map
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <SummaryCard
            icon={<Wrench className="w-3.5 h-3.5" />}
            label="In fleet"
            value={vehicles.length}
            sub="across all types"
            tone="neutral"
          />
          <SummaryCard
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="Damage pins"
            value={totalDamage}
            sub="areas with field docs"
            tone="rust"
          />
          <SummaryCard
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="Flagged"
            value={flagged}
            sub="vehicles with damage"
            tone="rust"
          />
          <SummaryCard
            icon={<Camera className="w-3.5 h-3.5" />}
            label="Jobs this week"
            value={jobsThisWeek}
            sub="on the calendar"
            tone="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3 min-h-0 flex-1 overflow-hidden">
          <div className="bg-white rounded-xl border border-ink-200 p-4 shadow-card flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-[13px] font-semibold text-ink-900 mb-0.5 shrink-0">
              How damage documentation works
            </h2>
            <p className="text-[11px] text-ink-500 mb-3 shrink-0">
              Same pattern as mobile — mirrored here for desk review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-h-0 flex-1">
              <StepCard
                step="01"
                title="Tap a body area"
                desc="Idle dots on the top-down map. Tech taps one to start a record."
                dotColor="green"
              />
              <StepCard
                step="02"
                title="Orange = documented"
                desc="Once photos are attached, the dot turns orange and stays on the map."
                dotColor="orange"
              />
              <StepCard
                step="03"
                title="Review & open"
                desc="Desk taps any orange pin to open field photos and notes."
                dotColor="orange"
                active
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-ink-200 p-4 shadow-card flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-[13px] font-semibold text-ink-900 mb-0.5 shrink-0">Fleet type mix</h2>
            <p className="text-[11px] text-ink-500 mb-3 shrink-0">Distribution across body styles</p>
            {typeMix.length === 0 ? (
              <p className="text-sm text-ink-400">Add vehicles to see the mix</p>
            ) : (
              <div className="space-y-2.5 min-h-0 overflow-hidden">
                {typeMix.slice(0, 4).map((t) => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-ink-700">{t.label}</span>
                      <span className="text-[11px] text-ink-500 tabular-nums">
                        {t.count} · {Math.round((t.count / total) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(t.count / total) * 100}%`,
                          background: t.hex,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-3 border-t border-ink-100 flex items-center gap-2 text-[10px] text-ink-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-brand-500" /> Green idle
              <span className="w-2 h-2 rounded-full bg-rust-500 ml-2" /> Damage logged
            </div>
          </div>
        </div>

        {suggested.length > 0 ? (
          <div className="shrink-0">
            <h2 className="text-[12px] font-semibold text-ink-700 mb-2">Suggested for review</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {suggested.map((v) => {
                const damage = damageCounts[v.id] ?? 0
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onPick(v.id)}
                    className="group bg-white rounded-lg border border-ink-200 px-3 py-2.5 text-left hover:border-brand-400 hover:shadow-card transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-md border border-ink-200 shrink-0"
                        style={{ background: paintHexFor(v) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink-900 truncate">
                          {vehicleLabel(v)}
                        </div>
                        <div className="text-[10px] text-ink-500 truncate">
                          {clientName(v.client_id) || 'No client'}
                          {damage > 0 ? ` · ${damage} pin${damage > 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-brand-600 shrink-0 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number
  sub: string
  tone: 'neutral' | 'rust'
}) {
  return (
    <div className="bg-white rounded-lg border border-ink-200 px-3 py-2.5 shadow-card">
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center ${
            tone === 'rust' ? 'bg-rust-50 text-rust-600' : 'bg-ink-100 text-ink-600'
          }`}
        >
          {icon}
        </div>
        <span className="text-[11px] text-ink-500 truncate">{label}</span>
      </div>
      <div className="text-[22px] font-bold text-ink-900 leading-none tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-400 mt-0.5 truncate">{sub}</div>
    </div>
  )
}

function StepCard({
  step,
  title,
  desc,
  dotColor,
  active,
}: {
  step: string
  title: string
  desc: string
  dotColor: 'green' | 'orange'
  active?: boolean
}) {
  return (
    <div
      className={`rounded-lg p-3 border min-h-0 ${
        active ? 'border-brand-400 bg-brand-50/50' : 'border-ink-200 bg-ink-50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-ink-400">{step}</span>
        <div className="relative">
          <div
            className={`w-5 h-5 rounded-full bg-white border-[2.5px] ${
              dotColor === 'orange' ? 'border-rust-500' : 'border-brand-500'
            }`}
          >
            {dotColor === 'orange' && (
              <div className="w-full h-full rounded-full bg-rust-500/20" />
            )}
          </div>
          {dotColor === 'green' && (
            <div className="absolute inset-0 rounded-full border border-brand-500/40 animate-cars-pin-pulse" />
          )}
        </div>
      </div>
      <div className="text-[12px] font-semibold text-ink-900 mb-0.5">{title}</div>
      <div className="text-[10px] text-ink-500 leading-snug line-clamp-3">{desc}</div>
    </div>
  )
}
