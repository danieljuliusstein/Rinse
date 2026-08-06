import { FileText, Pencil, Trash2 } from 'lucide-react'
import type { DeskForm, FieldType } from '@/lib/types'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  textarea: 'Long text',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  hidden: 'Hidden',
}

const FIELD_TYPE_GLYPHS: Record<FieldType, string> = {
  text: 'Aa',
  email: '@',
  phone: '#',
  textarea: '¶',
  select: '▾',
  checkbox: '☑',
  hidden: '·',
}

function formatCreated(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Props = {
  form: DeskForm
  busy?: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export default function FormCard({ form, busy, onOpen, onDelete }: Props) {
  const isLive = form.status === 'live'
  const chips = form.fields.slice(0, 4)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(form.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(form.id)
        }
      }}
      className={[
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white',
        'border transition-all duration-200',
        'hover:-translate-y-px hover:shadow-[0_12px_28px_-12px_rgba(16,24,40,0.16)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinse-green/30',
        isLive
          ? 'border-rinse-green-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
          : 'border-ink-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
      ].join(' ')}
    >
      {isLive ? (
        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-rinse-green" />
      ) : null}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isLive ? 'bg-rinse-green-soft text-rinse-green-text' : 'bg-ink-100 text-ink-500',
            ].join(' ')}
          >
            <FileText className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>

          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              isLive
                ? 'bg-rinse-green-soft text-rinse-green-text ring-1 ring-inset ring-rinse-green-border'
                : 'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200',
            ].join(' ')}
          >
            <span
              className={['h-1.5 w-1.5 rounded-full', isLive ? 'bg-rinse-green' : 'bg-ink-400'].join(
                ' ',
              )}
            />
            {isLive ? 'Live' : 'Draft'}
          </span>
        </div>

        <div>
          <h3 className="truncate text-[15px] font-semibold leading-tight text-ink-900">
            {form.name || 'Untitled form'}
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            {form.fields.length} {form.fields.length === 1 ? 'field' : 'fields'}
            <span className="px-1.5 text-ink-300">·</span>
            Created {formatCreated(form.created)}
          </p>
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((field) => (
              <span
                key={field.id}
                title={field.label}
                className="inline-flex max-w-full items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-500 ring-1 ring-inset ring-ink-200/80"
              >
                <span className="shrink-0 font-semibold text-ink-400">
                  {FIELD_TYPE_GLYPHS[field.type] ?? '?'}
                </span>
                <span className="truncate">{FIELD_TYPE_LABELS[field.type] ?? field.type}</span>
              </span>
            ))}
            {form.fields.length > 4 ? (
              <span className="inline-flex items-center rounded-lg bg-ink-50 px-2 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-inset ring-ink-200/80">
                +{form.fields.length - 4}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-[11px] text-ink-400">No fields yet</p>
        )}
      </div>

      <div
        className="mt-auto flex items-center gap-1 border-t border-ink-200/70 bg-ink-50/80 px-3 py-2.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpen(form.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:bg-white hover:text-ink-900"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(form.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Delete
        </button>
      </div>
    </div>
  )
}
