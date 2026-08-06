import { useState } from 'react'
import {
  BUILTIN_LABELS,
  createInboxLabel,
  deleteInboxLabel,
  renameInboxLabel,
  type InboxLabel,
} from '@/lib/inbox-labels'
import { colors } from '@/theme/colors'

type Props = {
  labels: InboxLabel[]
  onChange: () => void
}

export function LabelsManager({ labels, onChange }: Props) {
  const [name, setName] = useState('')

  return (
    <div className="flex flex-col h-full bg-gray-50 min-w-0">
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Manage Labels</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Team inboxes are labels. Assign them to chat threads from the conversation menu.
        </p>
      </div>
      <div className="p-4 max-w-lg space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createInboxLabel(name.trim())
            setName('')
            onChange()
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New label name"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-white px-3 rounded-full"
            style={{ background: colors.green }}
          >
            Add
          </button>
        </form>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {labels.map((l) => {
            const builtin = BUILTIN_LABELS.some((b) => b.id === l.id)
            return (
              <div key={l.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
                <input
                  className="flex-1 text-xs border border-transparent hover:border-gray-200 focus:border-green-400 rounded px-2 py-1"
                  defaultValue={l.name}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== l.name) {
                      renameInboxLabel(l.id, e.target.value)
                      onChange()
                    }
                  }}
                />
                {!builtin && (
                  <button
                    type="button"
                    className="text-[10px] text-red-500 hover:underline"
                    onClick={() => {
                      deleteInboxLabel(l.id)
                      onChange()
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
