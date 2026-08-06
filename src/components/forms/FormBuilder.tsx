import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { DeskFormField, DeskFormSettings, FieldType } from '@/lib/types'
import { insertField, removeField, reorderFields, updateField } from '@/pages/forms/formEditorState'
import { isPaletteId, type CatalogItem } from '@/pages/forms/fieldCatalog'
import FieldPalette, { PaletteGhost } from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldInspector from './FieldInspector'
import { FieldCardGhost } from './SortableFieldCard'

type ActiveDrag =
  | { kind: 'palette'; type: FieldType }
  | { kind: 'canvas'; field: DeskFormField }
  | null

type InspectorPane = 'field' | 'style' | 'options'

type Props = {
  fields: DeskFormField[]
  settings: DeskFormSettings
  selectedFieldId: string | null
  showPreview: boolean
  onFieldsChange: (fields: DeskFormField[]) => void
  onSettingsChange: (settings: DeskFormSettings) => void
  onSelectField: (id: string | null) => void
}

export default function FormBuilder({
  fields,
  settings,
  selectedFieldId,
  showPreview,
  onFieldsChange,
  onSettingsChange,
  onSelectField,
}: Props) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const [inspectorPane, setInspectorPane] = useState<InspectorPane>('style')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const selected = fields.find((f) => f.id === selectedFieldId) ?? null

  function selectField(id: string | null) {
    onSelectField(id)
    if (id) setInspectorPane('field')
  }

  function onDragStart(event: DragStartEvent) {
    const { active } = event
    const from = active.data.current?.from
    if (from === 'palette') {
      setActiveDrag({ kind: 'palette', type: active.data.current?.type as FieldType })
      return
    }
    if (from === 'canvas') {
      const field = fields.find((f) => f.id === active.id)
      if (field) setActiveDrag({ kind: 'canvas', field })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const from = active.data.current?.from as 'palette' | 'canvas' | undefined

    if (from === 'palette' || isPaletteId(active.id)) {
      const type = (active.data.current?.type as FieldType) ?? String(active.id).replace('palette:', '')
      let index = fields.length
      if (over.id !== 'canvas') {
        const overIndex = fields.findIndex((f) => f.id === over.id)
        if (overIndex >= 0) index = overIndex
      }
      const next = insertField(fields, type as FieldType, index)
      onFieldsChange(next)
      const inserted = next[Math.min(index, next.length - 1)]
      if (inserted) selectField(inserted.id)
      return
    }

    if (from === 'canvas' && active.id !== over.id && over.id !== 'canvas') {
      onFieldsChange(reorderFields(fields, String(active.id), String(over.id)))
    }
  }

  function onUpdateField(id: string, patch: Partial<Omit<DeskFormField, 'id'>>) {
    onFieldsChange(updateField(fields, id, patch))
  }

  function onRemoveField(id: string) {
    onFieldsChange(removeField(fields, id))
    if (selectedFieldId === id) onSelectField(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
        <FieldPalette />
        <FormCanvas
          fields={fields}
          settings={settings}
          selectedFieldId={selectedFieldId}
          showPreview={showPreview}
          onSelectField={selectField}
          onRemoveField={onRemoveField}
        />
        <FieldInspector
          field={selected}
          settings={settings}
          pane={inspectorPane}
          onPaneChange={setInspectorPane}
          onUpdateField={onUpdateField}
          onRemoveField={onRemoveField}
          onUpdateSettings={(patch) => onSettingsChange({ ...settings, ...patch })}
        />
      </div>

      <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeDrag?.kind === 'palette' ? (
          <PaletteGhost type={activeDrag.type as CatalogItem['type']} />
        ) : null}
        {activeDrag?.kind === 'canvas' ? <FieldCardGhost field={activeDrag.field} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
