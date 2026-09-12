import { type ReactNode } from 'react'

/** Shared card chrome — hover lift, optional click-through. */
export function WidgetCard({
  children,
  className = '',
  onOpen,
  style,
}: {
  children: ReactNode
  className?: string
  onOpen?: () => void
  style?: React.CSSProperties
}) {
  const interactive = Boolean(onOpen)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (!onOpen) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      style={style}
      className={[
        'bg-white rounded-[14px] p-3.5 border border-gray-200 text-left transition-all duration-200',
        'h-full min-h-0 min-w-0 overflow-hidden flex flex-col',
        interactive
          ? 'cursor-pointer hover:border-green-200 hover:shadow-md hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-green-200'
          : 'hover:border-gray-300 hover:shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/** Compact hover tooltip anchored above its child. */
export function Tip({
  label,
  children,
  className = '',
}: {
  label: ReactNode
  children: ReactNode
  className?: string
}) {
  if (!label) return <>{children}</>
  return (
    <span className={`relative group/tip ${className || 'inline-flex'}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-20 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 scale-95 transition-all duration-150 group-hover/tip:opacity-100 group-hover/tip:scale-100 shadow-lg"
      >
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}

export function stopCardClick(e: { stopPropagation: () => void }) {
  e.stopPropagation()
}
