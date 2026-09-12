'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import ActionToast, { type ActionToastKind, type ActionToastState } from '@/components/ActionToast'
import { isSignInRequiredError } from '@/lib/sign-in-required'

interface ActionToastContextValue {
  showSignInRequired: () => void
  showMessage: (message: string) => void
  handleWriteError: (error: unknown) => boolean
}

const ActionToastContext = createContext<ActionToastContextValue | null>(null)

const DISMISS_MS = 4000

export function ActionToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActionToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setToast(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const show = useCallback(
    (next: ActionToastState) => {
      dismiss()
      setToast(next)
      timerRef.current = setTimeout(dismiss, DISMISS_MS)
    },
    [dismiss],
  )

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const showSignInRequired = useCallback(() => {
    show({ kind: 'sign-in' })
  }, [show])

  const showMessage = useCallback(
    (message: string) => {
      show({ kind: 'message', message })
    },
    [show],
  )

  const handleWriteError = useCallback(
    (error: unknown) => {
      if (isSignInRequiredError(error)) {
        showSignInRequired()
        return true
      }
      return false
    },
    [showSignInRequired],
  )

  const value = useMemo(
    () => ({ showSignInRequired, showMessage, handleWriteError }),
    [showSignInRequired, showMessage, handleWriteError],
  )

  return (
    <ActionToastContext.Provider value={value}>
      {children}
      <ActionToast toast={toast} onDismiss={dismiss} />
    </ActionToastContext.Provider>
  )
}

export function useActionToast() {
  const ctx = useContext(ActionToastContext)
  if (!ctx) throw new Error('useActionToast must be used within ActionToastProvider')
  return ctx
}
