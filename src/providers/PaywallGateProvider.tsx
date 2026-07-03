'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import PaywallSheet from '@/components/PaywallSheet'
import { PREMIUM_REQUIRED_EVENT } from '@/lib/premium-api'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import {
  dismissTrialNudge,
  isTrialNudgeDismissed,
  resolveGate,
  resolveSubscriptionMode,
  type GateReason,
  type PremiumAction,
} from '@/lib/subscription-gates'

interface PaywallSheetState {
  open: boolean
  featureLabel: string
  mode: 'nudge' | 'lapsed'
  action: PremiumAction | null
}

interface PaywallGateContextValue {
  subscriptionMode: GateReason
  runGated: (action: PremiumAction, callback: () => void) => boolean
  openPaywall: (options?: { mode?: 'nudge' | 'lapsed'; featureLabel?: string }) => void
}

const PaywallGateContext = createContext<PaywallGateContextValue | null>(null)

export function PaywallGateProvider({ children }: { children: ReactNode }) {
  const { org, loading } = useOrgSubscription()
  const pendingActionRef = useRef<(() => void) | null>(null)
  const [sheet, setSheet] = useState<PaywallSheetState>({
    open: false,
    featureLabel: '',
    mode: 'lapsed',
    action: null,
  })

  const subscriptionMode = resolveSubscriptionMode(org, loading)

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
          open: true,
          featureLabel: result.featureLabel,
          mode: result.reason === 'nudge' ? 'nudge' : 'lapsed',
          action,
        })
      }

      return false
    },
    [org, loading]
  )

  const closeSheet = useCallback(() => {
    pendingActionRef.current = null
    setSheet((prev) => ({ ...prev, open: false, action: null }))
  }, [])

  const handleNotNow = useCallback(() => {
    const pending = pendingActionRef.current
    const action = sheet.action
    const mode = sheet.mode

    setSheet((prev) => ({ ...prev, open: false, action: null }))
    pendingActionRef.current = null

    if (mode === 'nudge' && action) {
      dismissTrialNudge(action)
      pending?.()
    }
  }, [sheet.action, sheet.mode])

  const openPaywall = useCallback(
    (options?: { mode?: 'nudge' | 'lapsed'; featureLabel?: string }) => {
      pendingActionRef.current = null
      const mode =
        options?.mode ??
        (resolveSubscriptionMode(org, loading) === 'lapsed' ? 'lapsed' : 'nudge')
      setSheet({
        open: true,
        featureLabel: options?.featureLabel ?? '',
        mode,
        action: null,
      })
    },
    [org, loading]
  )

  useEffect(() => {
    const onPremiumRequired = () => openPaywall({ mode: 'lapsed' })
    window.addEventListener(PREMIUM_REQUIRED_EVENT, onPremiumRequired)
    return () => window.removeEventListener(PREMIUM_REQUIRED_EVENT, onPremiumRequired)
  }, [openPaywall])

  const value = useMemo(
    () => ({
      subscriptionMode,
      runGated,
      openPaywall,
    }),
    [subscriptionMode, runGated, openPaywall]
  )

  return (
    <PaywallGateContext.Provider value={value}>
      {children}
      <PaywallSheet
        open={sheet.open}
        mode={sheet.mode}
        feature={sheet.featureLabel}
        onOpenChange={(open) => {
          if (!open) closeSheet()
        }}
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
