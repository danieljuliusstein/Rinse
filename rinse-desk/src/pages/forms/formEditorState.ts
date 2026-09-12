import { arrayMove } from '@dnd-kit/sortable'
import { newId } from '@/lib/orgStore'
import type { DeskFormField, FieldType } from '@/lib/types'
import { catalogItemFor } from './fieldCatalog'

export function createField(type: FieldType): DeskFormField {
  const catalog = catalogItemFor(type)
  const field: DeskFormField = {
    id: newId(),
    label: catalog?.defaultLabel ?? 'New field',
    type,
    required: false,
    width: 'full',
  }
  if (catalog?.defaultPlaceholder) field.placeholder = catalog.defaultPlaceholder
  if (catalog?.defaultOptions) field.options = [...catalog.defaultOptions]
  return field
}

export function insertField(fields: DeskFormField[], type: FieldType, index: number): DeskFormField[] {
  const next = [...fields]
  const clamped = Math.max(0, Math.min(index, next.length))
  next.splice(clamped, 0, createField(type))
  return next
}

export function reorderFields(fields: DeskFormField[], activeId: string, overId: string): DeskFormField[] {
  const oldIndex = fields.findIndex((f) => f.id === activeId)
  const newIndex = fields.findIndex((f) => f.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return fields
  return arrayMove(fields, oldIndex, newIndex)
}

export function updateField(
  fields: DeskFormField[],
  id: string,
  patch: Partial<Omit<DeskFormField, 'id'>>,
): DeskFormField[] {
  return fields.map((f) => (f.id === id ? { ...f, ...patch } : f))
}

export function removeField(fields: DeskFormField[], id: string): DeskFormField[] {
  return fields.filter((f) => f.id !== id)
}
