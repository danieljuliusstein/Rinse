import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DeskFormField } from '@/lib/types'

type Props = {
  field: DeskFormField
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}

export default function SortableFieldCard({ field, selected, onSelect, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { from: 'canvas' as const, fieldId: field.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const t = e.target as HTMLElement
          if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
          e.preventDefault()
          onRemove()
        }
      }}
      className={`group flex items-stretch gap-1 rounded-lg border bg-white touch-none outline-none transition-colors ${
        selected ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button
        type="button"
        className="px-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 min-w-0 py-2.5 pr-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-800 truncate">{field.label || 'Untitled'}</p>
          {field.required ? (
            <span className="text-[9px] font-semibold uppercase text-amber-700 bg-amber-50 px-1 rounded">
              Required
            </span>
          ) : null}
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {field.type}
          {field.mapTo ? ` · maps to ${field.mapTo}` : ''}
        </p>
        <div className="mt-2 h-7 rounded-md border border-dashed border-gray-200 bg-gray-50/80" />
      </div>

      <button
        type="button"
        title="Remove field"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="opacity-0 group-hover:opacity-100 self-start m-1.5 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-opacity"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )
}

export function FieldCardGhost({ field }: { field: DeskFormField }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-400 bg-white shadow-lg px-3 py-2.5 w-72">
      <p className="text-xs font-semibold text-gray-800 truncate">{field.label || 'Untitled'}</p>
      <span className="text-[10px] text-gray-400">{field.type}</span>
    </div>
  )
}
