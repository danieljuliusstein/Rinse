'use client'

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import { useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { lightHaptic } from '@/lib/haptics'

interface ReorderableListProps<T> {
  items: T[]
  getItemId: (item: T, index: number) => string
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  droppableId?: string
  className?: string
  itemClassName?: string
}

export default function ReorderableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  droppableId = 'reorderable-list',
  className,
  itemClassName = 'reorderable-list__item',
}: ReorderableListProps<T>) {
  const reduceMotion = useReducedMotion()

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const from = result.source.index
    const to = result.destination.index
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
    lightHaptic()
  }

  if (items.length < 2) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getItemId(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId} isDropDisabled={reduceMotion ?? false}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={className}>
            {items.map((item, index) => {
              const id = getItemId(item, index)
              return (
                <Draggable key={id} draggableId={id} index={index} isDragDisabled={reduceMotion ?? false}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`${itemClassName}${snapshot.isDragging ? ' reorderable-list__item--dragging' : ''}`}
                      style={dragProvided.draggableProps.style}
                    >
                      {renderItem(item, index)}
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
