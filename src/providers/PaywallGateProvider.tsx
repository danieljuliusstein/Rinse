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
import { PaywallSheet } from '@/src/components/PaywallSheet'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { subscribePremiumRequired } from '@/src/lib/premium-events'
import {
  dismissTrialNudge,
  isTrialNudgeDismissed,
  resolveGate,
  resolveSubscriptionMode,
  type GateReason,
  type PremiumAction,
} from '@/src/lib/subscription-gates'

interface PaywallSheetState {
  visible: boolean
  featureLabel: string
  mode: 'nudge' | 'lapsed' | 'free'
  action: PremiumAction | null
}

interface PaywallGateContextValue {
  subscriptionMode: GateReason
  runGated: (action: PremiumAction, callback: () => void) => boolean
  openPaywall: (options?: { mode?: 'nudge' | 'lapsed' | 'free'; featureLabel?: string }) => void
}

const PaywallGateContext = createContext<PaywallGateContextValue | null>(null)

export function PaywallGateProvider({ children }: { children: ReactNode }) {
  const { org, loading } = useOrgSubscription()
  const pendingActionRef = useRef<(() => void) | null>(null)
  const [sheet, setSheet] = useState<PaywallSheetState>({
    visible: false,
    featureLabel: '',
    mode: 'lapsed',
    action: null,
  })

  const subscriptionMode = resolveSubscriptionMode(org, loading)

  const openPaywall = useCallback(
    (options?: { mode?: 'nudge' | 'lapsed' | 'free'; featureLabel?: string }) => {
      pendingActionRef.current = null
      const resolved = resolveSubscriptionMode(org, loading)
      const mode =
        options?.mode ??
        (resolved === 'nudge' ? 'nudge' : resolved === 'free' ? 'free' : 'lapsed')
      setSheet({
        visible: true,
        featureLabel: options?.featureLabel ?? '',
        mode,
        action: null,
      })
    },
    [org, loading],
  )

  const runGated = useCallback(
    (action: PremiumAction, callback: () => void) => {
      const result = resolveGate(org, loading, action, {
        nudgeDismissed: isTrialNudgeDismissed(action),
      })

      if (result.allowed) {
        callback()
        return true
      }

      if (result.showPaywall) {
        pendingActionRef.current = result.reason === 'nudge' ? callback : null
        setSheet({
          visible: true,
          featureLabel: result.featureLabel,
          mode:
            result.reason === 'nudge'
              ? 'nudge'
              : result.reason === 'free'
                ? 'free'
                : 'lapsed',
          action,
        })
      }

      return false
    },
    [org, loading],
  )

  const closeSheet = useCallback(() => {
    pendingActionRef.current = null
    setSheet((prev) => ({ ...prev, visible: false, action: null }))
  }, [])

  const handleNotNow = useCallback(() => {
    const pending = pendingActionRef.current
    const action = sheet.action
    const mode = sheet.mode

    setSheet((prev) => ({ ...prev, visible: false, action: null }))
    pendingActionRef.current = null

    if (mode === 'nudge' && action) {
      dismissTrialNudge(action)
      pending?.()
    }
  }, [sheet.action, sheet.mode])

  useEffect(() => {
    return subscribePremiumRequired((payload) => {
      openPaywall({
        mode: payload.mode ?? 'lapsed',
        featureLabel: payload.featureLabel,
      })
    })
  }, [openPaywall])

  const value = useMemo(
    () => ({
      subscriptionMode,
      runGated,
      openPaywall,
    }),
    [subscriptionMode, runGated, openPaywall],
  )

  return (
    <PaywallGateContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={sheet.visible}
        mode={sheet.mode}
        featureLabel={sheet.featureLabel}
        onClose={closeSheet}
        onNotNow={handleNotNow}
      />
    </PaywallGateContext.Provider>
  )
}

export function usePaywallGateContext() {
  const ctx = useContext(PaywallGateContext)
  if (!ctx) throw new Error('usePaywallGateContext must be used within PaywallGateProvider')
  return ctx
}
