'use client'

import { useWindowVirtualizer, useVirtualizer } from '@tanstack/react-virtual'
import { useRef, type ReactNode } from 'react'

const VIRTUAL_THRESHOLD = 50

export interface VirtualListProps<T> {
  items: T[]
  estimateSize?: number
  getItemKey: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  /** Use window scroll (full-page lists). Default true for operator screens. */
  windowScroll?: boolean
  /** Gap between rows in px */
  gap?: number
}

/**
 * Virtualizes long lists (>50 items). Short lists render normally.
 * Swipe/transform wrappers belong on each row — not the scroll parent.
 */
export default function VirtualList<T>({
  items,
  estimateSize = 72,
  getItemKey,
  renderItem,
  className,
  windowScroll = true,
  gap = 0,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = items.length > VIRTUAL_THRESHOLD

  const windowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize + gap,
    overscan: 8,
    enabled: shouldVirtualize && windowScroll,
    measureElement: (el) => el.getBoundingClientRect().height + gap,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  })

  const containerVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan: 8,
    enabled: shouldVirtualize && !windowScroll,
    measureElement: (el) => el.getBoundingClientRect().height + gap,
  })

  const virtualizer = windowScroll ? windowVirtualizer : containerVirtualizer

  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className={`virtual-list${className ? ` ${className}` : ''}`}>
      <div
        className="virtual-list__inner"
        style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
        {virtualItems.map((vItem) => {
          const item = items[vItem.index]
          return (
            <div
              key={getItemKey(item, vItem.index)}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              className="virtual-list__item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {renderItem(item, vItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { VIRTUAL_THRESHOLD }
