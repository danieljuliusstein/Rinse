import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertModal,
  ChoiceModal,
  ConfirmModal,
  FormModal,
  type ChoiceAction,
  type FormField,
} from '@/components/Modal'

type AlertState = { title?: string; message: string } | null
type FormState = {
  title: string
  fields: FormField[]
  submitLabel?: string
  resolve: (values: Record<string, string> | null) => void
} | null
type ConfirmState = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  resolve: (ok: boolean) => void
} | null
type ChoiceState = {
  title?: string
  message: string
  actions: ChoiceAction[]
  cancelLabel?: string
  resolve: (id: string | null) => void
} | null

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export type ChoiceOptions = {
  title?: string
  message: string
  actions: ChoiceAction[]
  cancelLabel?: string
}

interface UiContextValue {
  alert: (message: string, title?: string) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  promptChoice: (opts: ChoiceOptions) => Promise<string | null>
  promptForm: (opts: {
    title: string
    fields: FormField[]
    submitLabel?: string
  }) => Promise<Record<string, string> | null>
  toast: (message: string, tone?: 'ok' | 'err') => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [choiceState, setChoiceState] = useState<ChoiceState>(null)
  const [formState, setFormState] = useState<FormState>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toastState, setToastState] = useState<{ message: string; tone: 'ok' | 'err' } | null>(null)

  const alert = useCallback((message: string, title = 'Notice') => {
    setAlertState({ message, title })
  }, [])

  const toast = useCallback((message: string, tone: 'ok' | 'err' = 'ok') => {
    setToastState({ message, tone })
    window.setTimeout(() => setToastState(null), 3200)
  }, [])

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...opts, resolve })
      }),
    [],
  )

  const promptChoice = useCallback(
    (opts: ChoiceOptions) =>
      new Promise<string | null>((resolve) => {
        setChoiceState({ ...opts, resolve })
      }),
    [],
  )

  const promptForm = useCallback(
    (opts: { title: string; fields: FormField[]; submitLabel?: string }) =>
      new Promise<Record<string, string> | null>((resolve) => {
        setFormError(null)
        setFormBusy(false)
        setFormState({ ...opts, resolve })
      }),
    [],
  )

  const value = useMemo(
    () => ({ alert, confirm, promptChoice, promptForm, toast }),
    [alert, confirm, promptChoice, promptForm, toast],
  )

  function settleConfirm(ok: boolean) {
    confirmState?.resolve(ok)
    setConfirmState(null)
  }

  function settleChoice(id: string | null) {
    choiceState?.resolve(id)
    setChoiceState(null)
  }

  return (
    <UiContext.Provider value={value}>
      {children}

      <AlertModal
        open={!!alertState}
        title={alertState?.title}
        message={alertState?.message ?? ''}
        onClose={() => setAlertState(null)}
      />

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        danger={confirmState?.danger}
        onCancel={() => settleConfirm(false)}
        onConfirm={() => settleConfirm(true)}
      />

      <ChoiceModal
        open={!!choiceState}
        title={choiceState?.title}
        message={choiceState?.message ?? ''}
        actions={choiceState?.actions ?? []}
        cancelLabel={choiceState?.cancelLabel}
        onCancel={() => settleChoice(null)}
        onPick={(id) => settleChoice(id)}
      />

      <FormModal
        open={!!formState}
        title={formState?.title ?? ''}
        fields={formState?.fields ?? []}
        submitLabel={formState?.submitLabel}
        busy={formBusy}
        error={formError}
        onClose={() => {
          formState?.resolve(null)
          setFormState(null)
          setFormError(null)
        }}
        onSubmit={async (values) => {
          setFormBusy(true)
          setFormError(null)
          formState?.resolve(values)
          setFormState(null)
          setFormBusy(false)
        }}
      />

      {toastState && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div
            className="px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border animate-[scaleIn_160ms_ease-out]"
            style={
              toastState.tone === 'err'
                ? { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }
                : { background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
            }
          >
            {toastState.message}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }
      `}</style>
    </UiContext.Provider>
  )
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}
