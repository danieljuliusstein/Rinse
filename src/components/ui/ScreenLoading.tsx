import type { ReactNode } from 'react'

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

export default function ScreenLoading({
  label = 'Loading…',
  className = '',
  body = false,
  inline = false,
}: {
  label?: string
  className?: string
  body?: boolean
  inline?: boolean
}) {
  return (
    <ScreenMessage className={className} body={body} inline={inline}>
      {label}
    </ScreenMessage>
  )
}
