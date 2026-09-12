'use client'

import Link from 'next/link'

export type ActionToastKind = 'sign-in' | 'message'

export interface ActionToastState {
  kind: ActionToastKind
  message?: string
}

interface ActionToastProps {
  toast: ActionToastState | null
  onDismiss: () => void
}

export default function ActionToast({ toast, onDismiss }: ActionToastProps) {
  if (!toast) return null

  if (toast.kind === 'sign-in') {
    return (
      <div className="action-toast" role="alert">
        <p className="action-toast__text">Sign in to save changes</p>
        <Link href="/auth" className="action-toast__link" onClick={onDismiss}>
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="action-toast" role="status">
      <p className="action-toast__text">{toast.message ?? 'Something went wrong'}</p>
      <button type="button" className="action-toast__link" onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        Dismiss
      </button>
    </div>
  )
}
