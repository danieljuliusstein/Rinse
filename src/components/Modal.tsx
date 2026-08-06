import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import AddressAutocompleteInput, {
  validateContactAddress,
} from '@/components/AddressAutocompleteInput'
import { colors } from '@/theme/colors'

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
  size,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  /** `xl` ~90vw for image lightbox; `wide` remains max-w-lg. */
  size?: 'md' | 'lg' | 'xl'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('input,textarea,select,button')
      el?.focus()
    }, 40)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] animate-[fadeIn_140ms_ease-out]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${
          size === 'xl'
            ? 'max-w-[min(90vw,960px)]'
            : wide || size === 'lg'
              ? 'max-w-lg'
              : 'max-w-md'
        } bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-[scaleIn_160ms_cubic-bezier(0.16,1,0.3,1)]`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 id={titleId} className="text-sm font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  )
}

export type FormField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'address'
  placeholder?: string
  required?: boolean
  defaultValue?: string
  options?: { value: string; label: string }[]
  /** Bias Nominatim when type is address. */
  addressContext?: string
}

type AddressDraft = {
  address: string
  lat?: number
  lng?: number
  pinned: boolean
}

export function FormModal({
  open,
  title,
  fields,
  submitLabel = 'Save',
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  fields: FormField[]
  submitLabel?: string
  busy?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void | Promise<void>
}) {
  const [addressDrafts, setAddressDrafts] = useState<Record<string, AddressDraft>>({})
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const next: Record<string, AddressDraft> = {}
    for (const field of fields) {
      if (field.type === 'address') {
        next[field.name] = {
          address: field.defaultValue ?? '',
          pinned: false,
        }
      }
    }
    setAddressDrafts(next)
    setLocalError(null)
  }, [open, fields])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const values: Record<string, string> = {}
    for (const field of fields) {
      if (field.type === 'address') {
        const draft = addressDrafts[field.name] ?? {
          address: '',
          pinned: false,
        }
        const address = draft.address.trim()
        const invalid = validateContactAddress({
          address,
          pinned: draft.pinned,
          requireStructuredManual: true,
        })
        if (invalid) {
          setLocalError(invalid)
          return
        }
        values[field.name] = address
        if (draft.pinned && draft.lat != null && draft.lng != null) {
          values[`${field.name}_lat`] = String(draft.lat)
          values[`${field.name}_lng`] = String(draft.lng)
          values[`${field.name}_pinned`] = '1'
        } else {
          values[`${field.name}_pinned`] = '0'
        }
      } else {
        values[field.name] = String(fd.get(field.name) ?? '').trim()
      }
    }
    setLocalError(null)
    void onSubmit(values)
  }

  const showError = localError || error

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {fields.map((field) => (
          <label key={field.name} className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">
              {field.label}
              {field.required ? '' : <span className="text-xs text-gray-400 font-normal"> (optional)</span>}
            </span>
            {field.type === 'select' ? (
              <select
                name={field.name}
                required={field.required}
                defaultValue={field.defaultValue ?? ''}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500 bg-white"
              >
                {!field.required && <option value="">Select…</option>}
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'address' ? (
              <AddressAutocompleteInput
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
                value={addressDrafts[field.name]?.address ?? ''}
                placeholder={field.placeholder ?? 'Start typing an address…'}
                context={field.addressContext}
                requireStructuredManual
                onChange={(address) =>
                  setAddressDrafts((prev) => ({
                    ...prev,
                    [field.name]: { address, pinned: false },
                  }))
                }
                onPickSuggestion={(hit) =>
                  setAddressDrafts((prev) => ({
                    ...prev,
                    [field.name]: {
                      address: hit.display_name,
                      lat: hit.lat,
                      lng: hit.lng,
                      pinned: true,
                    },
                  }))
                }
              />
            ) : (
              <input
                name={field.name}
                type={field.type ?? 'text'}
                required={field.required}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
              />
            )}
          </label>
        ))}
        {showError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {showError}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ background: colors.green }}
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function AlertModal({
  open,
  title = 'Notice',
  message,
  onClose,
}: {
  open: boolean
  title?: string
  message: string
  onClose: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-lg"
        style={{ background: colors.green }}
      >
        OK
      </button>
    </Modal>
  )
}

export function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg"
          style={{ background: danger ? colors.danger : colors.green }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
