import { useDraggable } from '@dnd-kit/core'
import { FIELD_CATALOG, paletteId, type CatalogItem } from '@/pages/forms/fieldCatalog'

function PaletteItem({ item }: { item: CatalogItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteId(item.type),
    data: { from: 'palette' as const, type: item.type },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-colors touch-none ${
        isDragging
          ? 'opacity-40 border-green-300 bg-green-50'
          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 text-gray-700'
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 text-gray-500 border border-gray-100">
        <FieldTypeIcon type={item.type} />
      </span>
      <span className="font-medium">{item.label}</span>
    </button>
  )
}

function FieldTypeIcon({ type }: { type: CatalogItem['type'] }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
  } as const
  switch (type) {
    case 'email':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...props}>
          <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.3 1.6.6 2.3a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.8-1.1a2 2 0 012.1-.4c.7.3 1.5.5 2.3.6a2 2 0 011.7 2z" />
        </svg>
      )
    case 'textarea':
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      )
    case 'select':
      return (
        <svg {...props}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h12M4 17h8" />
        </svg>
      )
  }
}

export function PaletteGhost({ type }: { type: CatalogItem['type'] }) {
  const item = FIELD_CATALOG.find((c) => c.type === type)
  if (!item) return null
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-green-400 bg-white shadow-lg text-xs text-gray-700 w-48">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-700 border border-green-100">
        <FieldTypeIcon type={item.type} />
      </span>
      <span className="font-medium">{item.label}</span>
    </div>
  )
}

export default function FieldPalette() {
  return (
    <div className="flex flex-col h-full min-h-0 border-r border-gray-100 bg-gray-50/80">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fields</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Drag onto the canvas</p>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {FIELD_CATALOG.map((item) => (
          <PaletteItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  )
}
