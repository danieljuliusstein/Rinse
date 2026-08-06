import { useEffect, useState } from 'react'
import { Modal } from '@/components/Modal'

type Props = {
  open: boolean
  title: string
  url: string
  onClose: () => void
  onDelete?: () => void
  deleting?: boolean
}

export function PhotoLightbox({ open, title, url, onClose, onDelete, deleting }: Props) {
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!open) return
    setLoadState('loading')
  }, [open, url, retryTick])

  return (
    <Modal open={open} title={title} onClose={onClose} size="xl">
      <div className="space-y-3">
        <div className="relative min-h-[200px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          {loadState === 'loading' && (
            <p className="absolute text-xs text-gray-400">Loading photo…</p>
          )}
          {loadState === 'error' ? (
            <div className="text-center px-4 py-8 space-y-2">
              <p className="text-sm text-gray-700">Could not load photo</p>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-700 underline"
                onClick={() => setRetryTick((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          ) : (
            <img
              key={`${url}-${retryTick}`}
              src={url}
              alt={title}
              className={`max-h-[70vh] w-auto max-w-full object-contain ${
                loadState === 'loading' ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setLoadState('ok')}
              onError={() => setLoadState('error')}
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          {onDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={onDelete}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
