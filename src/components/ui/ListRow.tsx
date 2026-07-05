'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Badge, { type BadgeTone } from './Badge'

type ListRowIconTone = 'blue' | 'green' | 'amber' | 'purple'

interface ListRowProps {
  icon?: ReactNode
  iconTone?: ListRowIconTone
  title: string
  subtitle?: string
  trailing?: ReactNode
  amount?: string
  amountTone?: 'default' | 'positive' | 'negative'
  badge?: ReactNode
  badgeTone?: BadgeTone
  badgeStatus?: string
  onClick?: () => void
  onLongPress?: () => void
  className?: string
  /** Wave C — shared layoutId for detail overlay morph */
  morphLayoutId?: string
}

export default function ListRow({
  icon,
  iconTone = 'blue',
  title,
  subtitle,
  trailing,
  amount,
  amountTone = 'default',
  badge,
  badgeTone,
  badgeStatus,
  onClick,
  onLongPress,
  className = '',
  morphLayoutId,
}: ListRowProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const reduceMotion = useReducedMotion()

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const interactive = Boolean(onClick)
  const amountClass =
    amountTone === 'positive'
      ? 'ui-list-row__amount currency--revenue'
      : amountTone === 'negative'
        ? 'ui-list-row__amount currency--expense'
        : 'ui-list-row__amount'

  const rowClass = `ui-list-row${interactive ? ' ui-list-row--pressable' : ''}${className ? ` ${className}` : ''}`

  const inner = (
    <>
      {icon ? (
        <span className={`ui-list-row__icon ui-list-row__icon--${iconTone}`}>{icon}</span>
      ) : null}
      <div className="ui-list-row__body">
        <p className="ui-list-row__title">{title}</p>
        {subtitle ? <p className="ui-list-row__subtitle">{subtitle}</p> : null}
        {badge ?? (badgeStatus || badgeTone ? (
          <Badge tone={badgeTone} status={badgeStatus} />
        ) : null)}
      </div>
      {(trailing || amount) && (
        <div className="ui-list-row__trailing">
          {amount ? <span className={amountClass}>{amount}</span> : null}
          {trailing}
        </div>
      )}
    </>
  )

  const handlers = {
    onClick: (e: React.MouseEvent) => {
      if (!onClick) return
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        e.preventDefault()
        return
      }
      onClick()
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!onClick) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    onContextMenu: (e: React.MouseEvent) => {
      if (!onLongPress) return
      e.preventDefault()
      onLongPress()
    },
    onTouchStart: () => {
      if (!onLongPress) return
      longPressTriggered.current = false
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        onLongPress()
      }, 450)
    },
    onTouchEnd: clearLongPress,
    onTouchMove: clearLongPress,
  }

  if (morphLayoutId && interactive) {
    return (
      <motion.div
        layoutId={reduceMotion ? undefined : morphLayoutId}
        role="button"
        tabIndex={0}
        className={rowClass}
        {...handlers}
      >
        {inner}
      </motion.div>
    )
  }

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={rowClass}
      {...handlers}
    >
      {inner}
    </div>
  )
}
