import type { ReactNode } from 'react'

interface SectionGroupProps {
  title: string
  meta?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function SectionGroup({ title, meta, action, children, className = '' }: SectionGroupProps) {
  return (
    <section className={`ui-section${className ? ` ${className}` : ''}`}>
      <div className="ui-section__header">
        <h2 className="ui-section__title">{title}</h2>
        <div className="ui-section__header-end">
          {meta ? <span className="ui-section__meta">{meta}</span> : null}
          {action}
        </div>
      </div>
      <div className="ui-list-group">{children}</div>
    </section>
  )
}
