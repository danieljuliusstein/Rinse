import { useState } from 'react'
import type { DeskFormField, DeskFormSettings, DeskFormStyle } from '@/lib/types'
import { formStyleToCssVars, resolveFormStyle } from '@/pages/forms/formStyle'

export type FormRenderMode = 'edit-preview' | 'simulate' | 'public'

type Props = {
  fields: DeskFormField[]
  settings?: DeskFormSettings
  mode: FormRenderMode
  contactSlot?: React.ReactNode
  onSubmit?: (payload: Record<string, string>) => void | Promise<void>
  submitting?: boolean
  /** Highlight a field in the live preview (editor selection) */
  selectedFieldId?: string | null
  onFieldClick?: (id: string) => void
}

function inputChrome(style: ReturnType<typeof resolveFormStyle>): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '100%',
    marginTop: 6,
    fontFamily: 'inherit',
    fontSize: 'var(--ff-label-size)',
    color: 'var(--ff-input-text)',
    background: 'var(--ff-input-bg)',
    outline: 'none',
  }

  if (style.inputStyle === 'underline') {
    return {
      ...base,
      border: 'none',
      borderBottom: '2px solid var(--ff-input-border)',
      borderRadius: 0,
      padding: '8px 0',
      minHeight: 'var(--ff-input-height)',
      background: 'transparent',
    }
  }

  if (style.inputStyle === 'filled') {
    return {
      ...base,
      border: '1px solid transparent',
      borderRadius: 'var(--ff-input-radius)',
      padding: '0 12px',
      minHeight: 'var(--ff-input-height)',
      background: 'var(--ff-input-bg)',
    }
  }

  return {
    ...base,
    border: '1px solid var(--ff-input-border)',
    borderRadius: 'var(--ff-input-radius)',
    padding: '0 12px',
    minHeight: 'var(--ff-input-height)',
  }
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
  style,
}: {
  field: DeskFormField
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  style: ReturnType<typeof resolveFormStyle>
}) {
  const chrome = inputChrome(style)
  const common = {
    id: `field-${field.id}`,
    name: field.id,
    required: Boolean(field.required),
    disabled,
    style: chrome,
    placeholder: field.placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
  }

  if (field.type === 'hidden') {
    return <input type="hidden" name={field.id} value={value} readOnly />
  }

  if (field.type === 'textarea') {
    return <textarea {...common} rows={3} style={{ ...chrome, minHeight: 88, paddingTop: 10, paddingBottom: 10 }} />
  }

  if (field.type === 'select') {
    return (
      <select {...common}>
        <option value="">{field.placeholder || 'Select…'}</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label
        className="flex items-center gap-2"
        style={{ marginTop: 6, color: 'var(--ff-label)', fontSize: 'var(--ff-label-size)' }}
      >
        <input
          type="checkbox"
          id={common.id}
          name={field.id}
          required={field.required}
          disabled={disabled}
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        {field.placeholder || field.label}
      </label>
    )
  }

  const htmlType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'
  return <input {...common} type={htmlType} />
}

export default function FormRenderer({
  fields,
  settings,
  mode,
  contactSlot,
  onSubmit,
  submitting,
  selectedFieldId,
  onFieldClick,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const readOnly = mode === 'edit-preview'
  const visible = fields.filter((f) => f.type !== 'hidden')
  const style = resolveFormStyle(settings?.style)
  const cssVars = formStyleToCssVars(settings?.style ?? {})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly || !onSubmit) return
    await onSubmit(values)
    if (mode === 'public') {
      setDone(true)
      setValues({})
    } else {
      setValues({})
    }
  }

  const shellStyle: React.CSSProperties = {
    ...cssVars,
    fontFamily: 'var(--ff-font)',
    width: '100%',
    maxWidth: 'var(--ff-width)',
    backgroundColor: 'var(--ff-bg)',
    backgroundImage: 'var(--ff-bg-image)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: 'var(--ff-pad)',
    borderStyle: 'solid',
    borderColor: 'var(--ff-border-color)',
    borderWidth: 'var(--ff-border-width)',
    borderRadius: 'var(--ff-radius)',
    boxShadow: 'var(--ff-shadow)',
  }

  if (done && mode === 'public') {
    return (
      <div style={shellStyle}>
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--ff-heading)', fontWeight: 600 }}>
          {settings?.successMessage || 'Thanks — we got your submission.'}
        </p>
      </div>
    )
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--ff-btn-width)',
    minWidth: style.buttonFullWidth ? undefined : 140,
    height: 'var(--ff-btn-height)',
    marginTop: 4,
    padding: '0 20px',
    border: 'none',
    borderRadius: 'var(--ff-btn-radius)',
    background: 'var(--ff-btn-bg)',
    color: 'var(--ff-btn-text)',
    fontFamily: 'inherit',
    fontSize: 'var(--ff-label-size)',
    fontWeight: 600,
    boxShadow: 'var(--ff-btn-shadow)',
    cursor: readOnly ? 'default' : 'pointer',
    opacity: submitting ? 0.6 : 1,
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ ...shellStyle, display: 'flex', flexDirection: 'column', gap: 'var(--ff-gap)' }}
      className="desk-form-renderer"
    >
      {style.heading ? (
        <h2 style={{ margin: 0, color: 'var(--ff-heading)', fontSize: 'var(--ff-heading-size)', fontWeight: 650, lineHeight: 1.2 }}>
          {style.heading}
        </h2>
      ) : null}
      {style.description ? (
        <p style={{ margin: 0, color: 'var(--ff-desc)', fontSize: 'var(--ff-label-size)', lineHeight: 1.45 }}>
          {style.description}
        </p>
      ) : null}

      {mode === 'simulate' && contactSlot}

      {visible.length === 0 ? (
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--ff-help)', padding: '24px 0' }}>No fields yet</p>
      ) : (
        visible.map((field) => {
          const selected = selectedFieldId === field.id
          return (
            <div
              key={field.id}
              role={onFieldClick ? 'button' : undefined}
              tabIndex={onFieldClick ? 0 : undefined}
              onClick={onFieldClick ? () => onFieldClick(field.id) : undefined}
              onKeyDown={
                onFieldClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onFieldClick(field.id)
                      }
                    }
                  : undefined
              }
              style={{
                width: field.width === 'half' ? '50%' : '100%',
                outline: selected ? '2px solid #22c55e' : undefined,
                outlineOffset: 4,
                borderRadius: 4,
                cursor: onFieldClick ? 'pointer' : undefined,
              }}
            >
              {field.type !== 'checkbox' && (
                <label
                  htmlFor={`field-${field.id}`}
                  style={{
                    display: 'block',
                    color: 'var(--ff-label)',
                    fontSize: 'var(--ff-label-size)',
                    fontWeight: 'var(--ff-label-weight)' as unknown as number,
                  }}
                >
                  {field.label}
                  {field.required ? <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span> : null}
                </label>
              )}
              <FieldInput
                field={field}
                value={values[field.id] ?? (field.type === 'checkbox' ? 'false' : '')}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                disabled={readOnly}
                style={style}
              />
              {field.helpText ? (
                <p style={{ margin: '4px 0 0', color: 'var(--ff-help)', fontSize: 11 }}>{field.helpText}</p>
              ) : null}
            </div>
          )
        })
      )}

      {readOnly ? (
        <div style={btnStyle} aria-hidden>
          {settings?.submitLabel || 'Submit'}
        </div>
      ) : (
        <button type="submit" disabled={submitting || visible.length === 0} style={btnStyle}>
          {submitting ? 'Submitting…' : settings?.submitLabel || 'Submit'}
        </button>
      )}

      <style>{`
        .desk-form-renderer input::placeholder,
        .desk-form-renderer textarea::placeholder {
          color: var(--ff-input-ph);
        }
        .desk-form-renderer input:focus,
        .desk-form-renderer textarea:focus,
        .desk-form-renderer select:focus {
          border-color: var(--ff-btn-bg) !important;
        }
      `}</style>
    </form>
  )
}

export type { DeskFormStyle }
