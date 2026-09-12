import type { ReactNode } from 'react'
import { Button } from '@/components/ui'
import EmptyIllustration, { type EmptyIllustrationKind } from './EmptyIllustration'

interface EmptyStateProps {
  icon?: ReactNode
  illustration?: EmptyIllustrationKind
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  const art = illustration ? (
    <EmptyIllustration kind={illustration} />
  ) : icon ? (
    icon
  ) : null

  return (
    <div className={`ui-empty${illustration ? ' ui-empty--illustrated' : ''}`}>
      {art ? <div className="ui-empty__art" aria-hidden="true">{art}</div> : null}
      <h3 className="ui-empty__title">{title}</h3>
      {description ? <p className="ui-empty__desc">{description}</p> : null}
      {actionLabel && onAction ? (
        <div className="ui-empty__action">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
      {children}
    </div>
  )
}
