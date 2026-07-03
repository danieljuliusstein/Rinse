'use client'

import { motion } from 'motion/react'

export interface MonthCarouselItem {
  id: string
  label: string
  value: string
  delta?: string
  deltaDirection?: 'up' | 'down' | 'flat'
  active?: boolean
}

interface MonthCarouselProps {
  items: MonthCarouselItem[]
  onSelect?: (id: string) => void
}

export default function MonthCarousel({ items, onSelect }: MonthCarouselProps) {
  return (
    <div className="ui-month-carousel" role="list">
      {items.map((item) => (
        <motion.button
          key={item.id}
          type="button"
          role="listitem"
          className={`ui-month-card${item.active ? ' ui-month-card--active' : ''}`}
          onClick={() => onSelect?.(item.id)}
          whileTap={{ scale: 0.98 }}
          layout
        >
          <p className="ui-month-card__label">{item.label}</p>
          <p className="ui-month-card__value">{item.value}</p>
          {item.delta ? (
            <p
              className={`ui-month-card__delta${
                item.deltaDirection === 'up'
                  ? ' ui-month-card__delta--up'
                  : item.deltaDirection === 'down'
                    ? ' ui-month-card__delta--down'
                    : ''
              }`}
            >
              {item.delta}
            </p>
          ) : null}
        </motion.button>
      ))}
    </div>
  )
}
