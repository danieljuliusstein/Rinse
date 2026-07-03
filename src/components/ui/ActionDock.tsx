import type { ReactNode } from 'react'

interface ActionDockProps {
  children: ReactNode
  /** Account for bottom tab bar (default on main screens). */
  aboveNav?: boolean
  className?: string
}

export default function ActionDock({ children, aboveNav = false, className = '' }: ActionDockProps) {
  return (
    <div
      className={`ui-action-dock${aboveNav ? ' ui-action-dock--with-nav' : ''}${className ? ` ${className}` : ''}`}
      role="toolbar"
    >
      {children}
    </div>
  )
}
