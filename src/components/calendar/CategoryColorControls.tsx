import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import {
  CATEGORY_COLOR_PRESETS,
  addCategory,
  loadCategories,
  type CalCategory,
} from '@/lib/calendar-categories'

type Props = {
  categories: CalCategory[]
  categoryId: string
  /** Current display color (event override or category default). */
  color: string
  onChangeCategory: (categoryId: string) => void
  onChangeColor: (color: string) => void
  onCategoriesChange: (cats: CalCategory[]) => void
  /** denser layout for the month popup */
  compact?: boolean
}

export function CategoryColorControls({
  categories,
  categoryId,
  color,
  onChangeCategory,
  onChangeColor,
  onCategoriesChange,
  compact,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(CATEGORY_COLOR_PRESETS[0]!)

  function createCategory() {
    const name = newName.trim()
    if (!name) return
    const cat = addCategory(name, newColor)
    const next = loadCategories()
    onCategoriesChange(next)
    onChangeCategory(cat.id)
    onChangeColor(cat.color)
    setNewName('')
    setNewColor(CATEGORY_COLOR_PRESETS[0]!)
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
            Category
          </span>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              Add
            </button>
          ) : null}
        </div>

        <div className={`grid gap-1.5 ${compact ? 'grid-cols-3' : 'grid-cols-5'}`}>
          {categories.map((cat) => {
            const active = cat.id === categoryId
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChangeCategory(cat.id)
                  onChangeColor(cat.color)
                }}
                title={cat.name}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-all ${
                  active
                    ? 'border-transparent ring-2 ring-offset-1 ring-offset-white'
                    : 'border-ink-200 hover:border-ink-300'
                }`}
                style={active ? { boxShadow: `0 0 0 2px ${cat.color}` } : undefined}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
                <span className="text-[10.5px] font-medium text-ink-600 truncate max-w-full">
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>

        {adding ? (
          <div className="mt-2 rounded-xl border border-ink-200 bg-ink-50/80 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink-700">New category</span>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => {
                  setAdding(false)
                  setNewName('')
                }}
                className="rounded p-1 text-ink-400 hover:bg-white hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  createCategory()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setAdding(false)
                  setNewName('')
                }
              }}
              placeholder="Name (e.g. Fleet)"
              className="w-full h-8 rounded-lg border border-ink-200 bg-white px-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLOR_PRESETS.map((hex) => {
                const active = newColor === hex
                return (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Color ${hex}`}
                    onClick={() => setNewColor(hex)}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      active ? 'scale-110 ring-2 ring-offset-1 ring-ink-900' : 'hover:scale-105'
                    }`}
                    style={{ background: hex }}
                  />
                )
              })}
            </div>
            <button
              type="button"
              disabled={!newName.trim()}
              onClick={createCategory}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-ink-900 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              Create category
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-500">
          Color
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_COLOR_PRESETS.map((hex) => {
            const active = color.toLowerCase() === hex.toLowerCase()
            return (
              <button
                key={hex}
                type="button"
                aria-label={`Use color ${hex}`}
                aria-pressed={active}
                onClick={() => onChangeColor(hex)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  active
                    ? 'scale-110 ring-2 ring-offset-2 ring-ink-900'
                    : 'hover:scale-105 ring-1 ring-black/5'
                }`}
                style={{ background: hex }}
              />
            )
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">
          Color applies to this event. Category keeps its own default.
        </p>
      </div>
    </div>
  )
}
