'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { isProPlan } from '@/lib/subscription'
import { PRO_ACTION_LABELS, type ProAction } from '@/lib/subscription-gates'

export function useProGate(action: ProAction) {
  const router = useRouter()
  const { org, loading } = useOrgSubscription()
  const featureLabel = PRO_ACTION_LABELS[action]
  const hasPro = !loading && isProPlan(org)

  const runProGated = useCallback(
    (callback: () => void) => {
      if (loading) return false
      if (hasPro) {
        callback()
        return true
      }
      router.push('/settings/billing?upgrade=pro')
      return false
    },
    [hasPro, loading, router]
  )

  return { action, featureLabel, hasPro, runProGated }
}
