import { useEffect, useState } from 'react'
import type { DeskFormField, DeskFormSettings, FieldMapTo, FieldType } from '@/lib/types'
import FormStylePanel from './FormStylePanel'

const fieldClass =
  'mt-1 w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:bg-white focus:border-green-400'

const V1_TYPES: FieldType[] = ['text', 'email', 'phone', 'textarea', 'select']
const MAP_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'name', label: 'Contact name' },
  { value: 'email', label: 'Contact email' },
  { value: 'phone', label: 'Contact phone' },
  { value: 'company', label: 'Company' },
]

type Pane = 'field' | 'style' | 'options'

type Props = {
  field: DeskFormField | null
  settings: DeskFormSettings
  pane?: Pane
  onPaneChange?: (pane: Pane) => void
  onUpdateField: (id: string, patch: Partial<Omit<DeskFormField, 'id'>>) => void
  onRemoveField: (id: string) => void
  onUpdateSettings: (patch: Partial<DeskFormSettings>) => void
}

export default function FieldInspector({
  field,
  settings,
  pane: controlledPane,
  onPaneChange,
  onUpdateField,
  onRemoveField,
  onUpdateSettings,
}: Props) {
  const [pane, setPane] = useState<Pane>(controlledPane ?? (field ? 'field' : 'style'))

  useEffect(() => {
    if (controlledPane) setPane(controlledPane)
  }, [controlledPane])

  useEffect(() => {
    if (controlledPane) return
    if (field) setPane('field')
  }, [field, controlledPane])

  function go(next: Pane) {
    setPane(next)
    onPaneChange?.(next)
  }

  const tabs: { id: Pane; label: string }[] = [
    { id: 'field', label: 'Field' },
    { id: 'style', label: 'Style' },
    { id: 'options', label: 'Options' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0 border-l border-gray-100 bg-white">
      <div className="px-2 py-2 border-b border-gray-100">
        <div className="flex p-0.5 bg-gray-100 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={`flex-1 px-2 py-1 text-[11px] rounded-md ${
                pane === t.id ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {pane === 'style' ? (
          <FormStylePanel
            style={settings.style ?? {}}
            onChange={(style) => onUpdateSettings({ style })}
          />
        ) : null}

        {pane === 'options' ? (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Behavior</p>
            <label className="block text-[11px] font-medium text-gray-500">
              Submit button label
              <input
                className={fieldClass}
                value={settings.submitLabel ?? ''}
                placeholder="Submit"
                onChange={(e) => onUpdateSettings({ submitLabel: e.target.value || undefined })}
              />
            </label>
            <label className="block text-[11px] font-medium text-gray-500">
              Success message
              <input
                className={fieldClass}
                value={settings.successMessage ?? ''}
                placeholder="Thanks — we got your submission."
                onChange={(e) => onUpdateSettings({ successMessage: e.target.value || undefined })}
              />
            </label>
            <label className="block text-[11px] font-medium text-gray-500">
              Redirect URL
              <input
                className={fieldClass}
                value={settings.redirectUrl ?? ''}
                placeholder="https://…"
                onChange={(e) => onUpdateSettings({ redirectUrl: e.target.value || undefined })}
              />
            </label>
          </div>
        ) : null}

        {pane === 'field' ? (
          field ? (
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-gray-500">
                Label
                <input
                  className={fieldClass}
                  value={field.label}
                  onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                />
              </label>

              <label className="block text-[11px] font-medium text-gray-500">
                Type
                <select
                  className={fieldClass}
                  value={field.type}
                  onChange={(e) => {
                    const type = e.target.value as FieldType
                    const patch: Partial<DeskFormField> = { type }
                    if (type === 'select' && !field.options?.length) {
                      patch.options = ['Option A', 'Option B', 'Option C']
                    }
                    onUpdateField(field.id, patch)
                  }}
                >
                  {V1_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  {!V1_TYPES.includes(field.type) ? (
                    <option value={field.type}>{field.type}</option>
                  ) : null}
                </select>
              </label>

              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(e) => onUpdateField(field.id, { required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Required
              </label>

              <label className="block text-[11px] font-medium text-gray-500">
                Placeholder
                <input
                  className={fieldClass}
                  value={field.placeholder ?? ''}
                  onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
                />
              </label>

              <label className="block text-[11px] font-medium text-gray-500">
                Help text
                <input
                  className={fieldClass}
                  value={field.helpText ?? ''}
                  onChange={(e) => onUpdateField(field.id, { helpText: e.target.value || undefined })}
                />
              </label>

              {field.type === 'select' ? (
                <label className="block text-[11px] font-medium text-gray-500">
                  Options <span className="text-gray-400 font-normal">(one per line)</span>
                  <textarea
                    className={fieldClass}
                    rows={4}
                    value={(field.options ?? []).join('\n')}
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        options: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              ) : null}

              <label className="block text-[11px] font-medium text-gray-500">
                Map to contact
                <select
                  className={fieldClass}
                  value={field.mapTo ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    onUpdateField(field.id, {
                      mapTo: (v === '' ? null : v) as FieldMapTo,
                    })
                  }}
                >
                  {MAP_OPTIONS.map((o) => (
                    <option key={o.value || 'none'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => onRemoveField(field.id)}
                className="w-full text-xs font-medium text-red-600 border border-red-100 rounded-lg py-2 hover:bg-red-50"
              >
                Delete field
              </button>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-gray-500">Select a field on the canvas</p>
              <button
                type="button"
                onClick={() => go('style')}
                className="text-xs font-medium text-green-700 hover:underline"
              >
                Or open Style to design the form →
              </button>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
