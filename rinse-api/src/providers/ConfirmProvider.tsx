'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import ConfirmSheet, { type ConfirmSheetProps } from '@/components/ConfirmSheet'

export type ConfirmRequest = Pick<
  ConfirmSheetProps,
  'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'destructive'
>

type ConfirmFn = (request: ConfirmRequest) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((req) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setRequest(req)
    })
  }, [])

  const close = useCallback((value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setRequest(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <ConfirmSheet
          {...request}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
