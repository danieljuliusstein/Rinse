import type { ReactNode } from 'react'
import {
  DetailScreenSkeleton,
  HomeScreenSkeleton,
  InlineScreenSkeleton,
  InventoryHomeSkeleton,
  ListScreenSkeleton,
  SettingsScreenSkeleton,
} from './ScreenSkeletons'

export type ScreenLoadingMode = 'skeleton' | 'text'
export type ScreenLoadingVariant = 'list' | 'detail' | 'settings' | 'home' | 'inline' | 'inventory'

interface ScreenMessageProps {
  children: ReactNode
  className?: string
  body?: boolean
  inline?: boolean
  role?: 'status' | 'alert'
  live?: 'polite' | 'assertive' | 'off'
}

export function ScreenMessage({
  children,
  className = '',
  body = false,
  inline = false,
  role = 'status',
  live = 'polite',
}: ScreenMessageProps) {
  const classes = inline
    ? ['screen-message', 'screen-message--inline', className]
    : ['screen', 'page-content', body ? 'body' : '', 'screen-message', className]
  const classNameStr = classes.filter(Boolean).join(' ')

  return (
    <div className={classNameStr} role={role} aria-live={live}>
      {children}
    </div>
  )
}

function resolveVariant(
  variant: ScreenLoadingVariant | undefined,
  body: boolean,
  inline: boolean,
): ScreenLoadingVariant {
  if (variant) return variant
  if (inline) return 'inline'
  return 'list'
}

function ScreenSkeleton({
  variant,
  label,
}: {
  variant: ScreenLoadingVariant
  label: string
}) {
  const skeleton =
    variant === 'home' ? (
      <HomeScreenSkeleton />
    ) : variant === 'detail' ? (
      <DetailScreenSkeleton />
    ) : variant === 'settings' ? (
      <SettingsScreenSkeleton />
    ) : variant === 'inventory' ? (
      <InventoryHomeSkeleton />
    ) : variant === 'inline' ? (
      <InlineScreenSkeleton />
    ) : (
      <ListScreenSkeleton />
    )

  return (
    <div className="screen-loading-skeleton" role="status" aria-live="polite" aria-label={label}>
      {skeleton}
    </div>
  )
}

export default function ScreenLoading({
  label = 'Loading…',
  className = '',
  body = false,
  inline = false,
  mode = 'skeleton',
  variant,
}: {
  label?: string
  className?: string
  body?: boolean
  inline?: boolean
  /** `skeleton` (default) or `text` for legacy plain-text fallback */
  mode?: ScreenLoadingMode
  variant?: ScreenLoadingVariant
}) {
  if (mode === 'text') {
    return (
      <ScreenMessage className={className} body={body} inline={inline}>
        {label}
      </ScreenMessage>
    )
  }

  const resolved = resolveVariant(variant, body, inline)
  const shellClass = inline
    ? ['screen-loading-shell', 'screen-loading-shell--inline', className]
    : ['screen', 'page-content', body ? 'body' : '', 'screen-loading-shell', className]

  return (
    <div className={shellClass.filter(Boolean).join(' ')}>
      <ScreenSkeleton variant={resolved} label={label} />
    </div>
  )
}
