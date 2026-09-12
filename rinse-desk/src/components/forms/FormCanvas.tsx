import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DeskFormField, DeskFormSettings } from '@/lib/types'
import SortableFieldCard from './SortableFieldCard'
import FormPreview from './FormPreview'

type Props = {
  fields: DeskFormField[]
  settings?: DeskFormSettings
  selectedFieldId: string | null
  showPreview: boolean
  onSelectField: (id: string | null) => void
  onRemoveField: (id: string) => void
}

export default function FormCanvas({
  fields,
  settings,
  selectedFieldId,
  showPreview,
  onSelectField,
  onRemoveField,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' })

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f0f1f3]">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Canvas</p>
        <p className="text-[10px] text-gray-400">Structure above · branded preview below</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div
          ref={setNodeRef}
          className={`rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors ${
            isOver ? 'border-green-400 bg-green-50/50' : 'border-gray-300/80 bg-white/70'
          }`}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-0.5">Structure</p>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-gray-500">Drop fields here</p>
                <p className="text-xs text-gray-400 mt-1">Then open Style to brand the live form</p>
              </div>
            ) : (
              fields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  selected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onRemove={() => onRemoveField(field.id)}
                />
              ))
            )}
          </SortableContext>
        </div>

        {showPreview ? (
          <FormPreview
            fields={fields}
            settings={settings}
            selectedFieldId={selectedFieldId}
            onFieldClick={(id) => onSelectField(id)}
          />
        ) : null}
      </div>
    </div>
  )
}
