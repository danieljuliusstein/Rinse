import type { ReactNode } from 'react'
import type { VehicleType } from '@/lib/types'
import { colors } from '@/theme/colors'

import sedanImg from '@/assets/vehicles/sedan.png'
import suvImg from '@/assets/vehicles/suv.png'
import truckImg from '@/assets/vehicles/truck.png'

export const FLEET_TYPES: VehicleType[] = ['sedan', 'suv', 'truck', 'van', 'boat']

export const TYPE_META: Record<VehicleType, { label: string; accent: string }> = {
  sedan: { label: 'Sedan', accent: colors.teal },
  suv: { label: 'SUV', accent: colors.greenDark },
  truck: { label: 'Truck', accent: colors.amber },
  van: { label: 'Van', accent: colors.blue },
  boat: { label: 'Boat', accent: '#6D28D9' },
  other: { label: 'Other', accent: colors.textMuted },
}

/** Photoreal stock cutouts (transparent) for primary fleet types. */
const STOCK_PNG: Partial<Record<VehicleType, string>> = {
  sedan: sedanImg,
  suv: suvImg,
  truck: truckImg,
  other: sedanImg,
}

type SvgProps = { className?: string; paint?: string }

const DEFAULT_PAINT = '#C5CAD3'
const DARK = '#1a1d24'
const GLASS = 'rgba(160, 200, 230, 0.35)'
const GLASS_EDGE = 'rgba(255,255,255,0.2)'

function GroundGlow({ paint }: { paint: string }) {
  return (
    <>
      <ellipse cx="200" cy="188" rx="118" ry="10" fill={paint} opacity="0.14" />
      <ellipse cx="200" cy="190" rx="96" ry="6" fill="#000" opacity="0.35" />
    </>
  )
}

function Wheel({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={DARK} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#2a2e38" stroke="#4a5160" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#5a6270" />
    </g>
  )
}

/** Fallback SVG when no stock PNG (van / boat). */
function VanModel({ className, paint = DEFAULT_PAINT }: SvgProps) {
  const uid = 'van'
  return (
    <svg viewBox="0 0 400 200" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-body`} x1="40" y1="20" x2="340" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.4" stopColor={paint} />
          <stop offset="1" stopColor={paint} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <GroundGlow paint={paint} />
      <path
        d="M42 148c2-36 10-58 28-68 10-6 24-10 42-10h196c18 0 32 6 42 20 10 16 14 36 16 56v8H50c-10 0-14-6-8-6z"
        fill={`url(#${uid}-body)`}
      />
      <path d="M118 78h52v44H114c2-16 3-32 4-44z" fill={GLASS} stroke={GLASS_EDGE} />
      <path d="M176 78h92v44H176V78z" fill={GLASS} stroke={GLASS_EDGE} opacity="0.9" />
      <path d="M274 78h48c6 0 10 4 12 10v34h-60V78z" fill={GLASS} stroke={GLASS_EDGE} opacity="0.85" />
      <path d="M48 120h28c5 0 8 3 8 6v10H42v-10c0-4 3-6 6-6z" fill="#e8f4ff" opacity="0.75" />
      <path d="M42 148h316c4 0 8 2 8 6v4H38v-4c0-4 2-6 4-6z" fill={DARK} opacity="0.4" />
      <Wheel cx={108} cy={156} r={22} />
      <Wheel cx={300} cy={156} r={22} />
    </svg>
  )
}

function BoatModel({ className, paint = DEFAULT_PAINT }: SvgProps) {
  const uid = 'boat'
  return (
    <svg viewBox="0 0 400 200" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-hull`} x1="40" y1="80" x2="360" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor={paint} />
          <stop offset="1" stopColor={paint} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="178" rx="130" ry="9" fill={paint} opacity="0.12" />
      <ellipse cx="200" cy="180" rx="110" ry="5" fill="#000" opacity="0.3" />
      <path
        d="M36 140c16-10 48-20 90-22h160c36 0 62 8 78 16 6 3 6 8 0 12-18 12-60 22-118 22H90c-32 0-54-6-64-14-6-4-2-10 10-14z"
        fill={`url(#${uid}-hull)`}
      />
      <path d="M168 72h14v52h-14V72z" fill={paint} opacity="0.85" />
      <path d="M182 86l64 22H182V86z" fill={GLASS} stroke={GLASS_EDGE} />
      <path d="M120 118h140c6 0 10 2 10 6v8H114v-8c0-4 2-6 6-6z" fill="#fff" opacity="0.15" />
    </svg>
  )
}

const SVG_FALLBACK: Partial<Record<VehicleType, (p: SvgProps) => ReactNode>> = {
  van: VanModel,
  boat: BoatModel,
}

type StockProps = {
  type: VehicleType
  className?: string
  paint?: string
  alt?: string
}

/** One stock vehicle for the selected type — PNG cutouts for sedan/SUV/truck. */
export function StockTypeVehicle({ type, className = '', paint, alt }: StockProps) {
  const label = alt ?? `${TYPE_META[type]?.label ?? 'Vehicle'} stock view`
  const png = STOCK_PNG[type]
  const body =
    paint && /^#?[0-9a-fA-F]{3,8}$/.test(paint.trim())
      ? paint.startsWith('#')
        ? paint
        : `#${paint}`
      : DEFAULT_PAINT

  if (png) {
    return (
      <div
        className={`relative flex items-end justify-center pointer-events-none select-none ${className}`}
        role="img"
        aria-label={label}
      >
        <div
          className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[70%] h-[10%] rounded-[100%] blur-xl"
          style={{ background: 'rgba(34,197,94,0.16)' }}
          aria-hidden
        />
        <div
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[55%] h-[5%] rounded-[100%] bg-black/40 blur-md"
          aria-hidden
        />
        <img
          src={png}
          alt=""
          draggable={false}
          className="relative z-[1] w-full max-w-xl h-auto max-h-[230px] object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
        />
      </div>
    )
  }

  const Comp = SVG_FALLBACK[type] ?? VanModel
  return (
    <div
      className={`relative flex items-end justify-center pointer-events-none select-none ${className}`}
      role="img"
      aria-label={label}
    >
      <Comp
        className="relative z-[1] w-full max-w-xl h-auto max-h-[230px] drop-shadow-[0_18px_36px_rgba(0,0,0,0.4)]"
        paint={body}
      />
    </div>
  )
}
