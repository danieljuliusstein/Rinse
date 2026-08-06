import { useState } from 'react'
import type { DeskClient } from '@/lib/types'
import { colors } from '@/theme/colors'

type Props = {
  open: boolean
  clients: DeskClient[]
  onClose: () => void
  onSubmit: (input: {
    visitor_name: string
    visitor_email?: string
    contact_id?: string
    first_message: string
  }) => Promise<void>
}

export function SimulateVisitorModal({ open, clients, onClose, onSubmit }: Props) {
  const [name, setName] = useState('Visitor')
  const [email, setEmail] = useState('')
  const [contactId, setContactId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Simulate visitor</p>
            <p className="text-[11px] text-gray-400">Starts a thread as the embeddable widget would</p>
          </div>
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form
          className="p-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!message.trim()) return
            setBusy(true)
            setError(null)
            void onSubmit({
              visitor_name: name.trim() || 'Visitor',
              visitor_email: email.trim() || undefined,
              contact_id: contactId || undefined,
              first_message: message.trim(),
            })
              .then(() => {
                setMessage('')
                onClose()
              })
              .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed')
              })
              .finally(() => setBusy(false))
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
          />
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
          >
            <option value="">Link contact…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Hi, I have a question…"
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
            required
          />
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-50 rounded-lg" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !message.trim()}
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-full disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: colors.green }}
            >
              {busy ? 'Starting…' : 'Start chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
