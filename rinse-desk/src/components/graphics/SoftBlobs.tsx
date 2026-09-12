import type { ReactNode, SVGProps } from 'react'
import { colors } from '@/theme/colors'

export type BlobScene =
  | 'deals'
  | 'inbox'
  | 'calendar'
  | 'money'
  | 'contacts'
  | 'activity'
  | 'help'
  | 'generic'

type SoftBlobArtProps = {
  scene?: BlobScene
  className?: string
  size?: number
}

/** Soft organic blob scenes — Rinse graphic language (not stock icons). */
export function SoftBlobArt({ scene = 'generic', className = '', size = 160 }: SoftBlobArtProps) {
  const w = size
  const h = Math.round(size * 0.88)

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`soft-blob-art ${className}`}
      aria-hidden
    >
      {/* Ambient wash */}
      <ellipse cx="100" cy="150" rx="78" ry="14" fill={colors.green} opacity="0.08" />
      <path
        d="M42 118c18-42 48-70 88-66 28 3 48 28 44 54-5 32-38 48-72 46-36-2-70-10-60-34z"
        fill={colors.greenSoft}
        className="soft-blob-drift"
      />
      <path
        d="M28 96c12-28 36-44 62-40 22 4 34 24 30 44-6 28-40 38-68 32-24-5-34-16-24-36z"
        fill={colors.green}
        opacity="0.18"
        className="soft-blob-drift soft-blob-drift-delay"
      />
      <path
        d="M118 72c16-22 42-28 58-14 14 12 12 36-4 48-18 14-42 12-56-2-12-12-10-22 2-32z"
        fill={colors.teal}
        opacity="0.22"
        className="soft-blob-drift soft-blob-drift-slow"
      />
      <path
        d="M54 58c10-16 28-22 40-12 10 8 8 24-4 32-14 10-30 6-38-6-6-10-4-8 2-14z"
        fill={colors.amber}
        opacity="0.2"
      />

      {scene === 'deals' && <DealsMotif />}
      {scene === 'inbox' && <InboxMotif />}
      {scene === 'calendar' && <CalendarMotif />}
      {scene === 'money' && <MoneyMotif />}
      {scene === 'contacts' && <ContactsMotif />}
      {scene === 'activity' && <ActivityMotif />}
      {scene === 'help' && <HelpMotif />}
      {scene === 'generic' && <GenericMotif />}
    </svg>
  )
}

function DealsMotif() {
  return (
    <g>
      <rect x="78" y="78" width="44" height="52" rx="14" fill="white" opacity="0.92" />
      <rect x="86" y="88" width="28" height="6" rx="3" fill={colors.green} opacity="0.55" />
      <rect x="86" y="100" width="20" height="5" rx="2.5" fill={colors.green} opacity="0.28" />
      <circle cx="100" cy="70" r="10" fill={colors.green} opacity="0.85" />
      <path d="M100 66v8M96 70h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function InboxMotif() {
  return (
    <g>
      <path
        d="M70 88c0-8 8-14 30-14s30 6 30 14v28c0 10-10 16-30 16s-30-6-30-16V88z"
        fill="white"
        opacity="0.92"
      />
      <path d="M72 90l28 18 28-18" stroke={colors.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx="128" cy="78" r="9" fill={colors.amber} opacity="0.9" />
    </g>
  )
}

function CalendarMotif() {
  return (
    <g>
      <rect x="72" y="72" width="56" height="52" rx="12" fill="white" opacity="0.92" />
      <rect x="72" y="72" width="56" height="16" rx="12" fill={colors.green} opacity="0.75" />
      <circle cx="86" cy="104" r="4" fill={colors.green} opacity="0.45" />
      <circle cx="100" cy="104" r="4" fill={colors.teal} opacity="0.55" />
      <circle cx="114" cy="104" r="4" fill={colors.amber} opacity="0.5" />
    </g>
  )
}

function MoneyMotif() {
  return (
    <g>
      <ellipse cx="100" cy="104" rx="34" ry="28" fill="white" opacity="0.92" />
      <ellipse cx="100" cy="104" rx="22" ry="18" fill={colors.greenSoft} />
      <text
        x="100"
        y="110"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={colors.greenDark}
        fontFamily="DM Sans, sans-serif"
      >
        $
      </text>
    </g>
  )
}

function ContactsMotif() {
  return (
    <g>
      <circle cx="88" cy="86" r="14" fill="white" opacity="0.95" />
      <circle cx="112" cy="86" r="14" fill="white" opacity="0.85" />
      <circle cx="100" cy="108" r="16" fill="white" opacity="0.9" />
      <circle cx="88" cy="84" r="6" fill={colors.green} opacity="0.55" />
      <circle cx="112" cy="84" r="6" fill={colors.teal} opacity="0.55" />
      <circle cx="100" cy="106" r="7" fill={colors.amber} opacity="0.5" />
    </g>
  )
}

function ActivityMotif() {
  return (
    <g>
      <circle cx="100" cy="96" r="28" fill="white" opacity="0.92" />
      <circle cx="100" cy="96" r="20" stroke={colors.green} strokeWidth="4" opacity="0.35" fill="none" />
      <path d="M100 84v14l10 6" stroke={colors.green} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function HelpMotif() {
  return (
    <g>
      <circle cx="100" cy="96" r="30" fill="white" opacity="0.92" />
      <path
        d="M90 88c2-8 8-12 16-10 6 2 8 8 4 12-4 4-8 6-8 12"
        stroke={colors.green}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <circle cx="100" cy="118" r="3.5" fill={colors.green} opacity="0.75" />
    </g>
  )
}

function GenericMotif() {
  return (
    <g>
      <circle cx="100" cy="98" r="22" fill="white" opacity="0.9" />
      <circle cx="100" cy="98" r="10" fill={colors.green} opacity="0.55" />
    </g>
  )
}

/** Soft blob brand mark for sidebar / headers */
export function SoftBlobMark({
  initials,
  size = 28,
  title,
}: {
  initials: string
  size?: number
  title?: string
}) {
  const letter = initials.slice(0, 2)
  const gradId = `blobMarkGrad-${letter.replace(/\W/g, '') || 'x'}-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="flex-shrink-0 soft-blob-mark"
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5c7.5 0 14 4.2 15.2 11.2 1.2 7-2.8 14.2-9.6 16.4-6.2 2-14 .4-17.4-5.2C4.8 19.2 6 10.2 11.6 6.2 14.4 4.2 17.2 2.5 20 2.5z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M26 10c3.2 1.2 5 4.4 4.2 7.4-.8 3.2-4 5-7 4.4"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontSize={letter.length > 1 ? 12 : 14}
        fontWeight="700"
        fill="white"
        fontFamily="DM Sans, sans-serif"
      >
        {letter}
      </text>
    </svg>
  )
}

type EmptyStateProps = {
  scene?: BlobScene
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  scene = 'generic',
  title,
  description,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-6 px-3' : 'py-10 px-4'
      } ${className}`}
    >
      <SoftBlobArt scene={scene} size={compact ? 112 : 148} />
      <p className={`font-semibold text-gray-800 ${compact ? 'text-xs mt-2' : 'text-sm mt-3'}`}>{title}</p>
      {description && (
        <p className={`text-gray-400 max-w-[240px] leading-relaxed ${compact ? 'text-[10px] mt-1' : 'text-xs mt-1.5'}`}>
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-2.5' : 'mt-4'}>{action}</div>}
    </div>
  )
}

export function SoftBlobBackdrop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M-20 140c40-80 120-110 200-90 70 18 130 70 120 120-12 55-100 70-180 55C40 210-40 190-20 140z"
        fill={colors.green}
        opacity="0.06"
      />
      <path
        d="M220 20c50-30 120-10 140 40 22 52-20 100-80 110-55 8-110-30-100-70 8-32 30-60 40-80z"
        fill={colors.teal}
        opacity="0.07"
      />
      <path
        d="M60 0c40 10 70 40 60 70-12 40-70 50-100 30C-10 80-10 20 20 5 35-2 45-4 60 0z"
        fill={colors.amber}
        opacity="0.06"
      />
    </svg>
  )
}
