import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { fetchOrgSubscription } from '@/src/lib/subscription-fetch'
import {
  isFoundingMember,
  isSubscribedOnStripe,
  isSubscriptionActive,
  trialDaysLeft,
  type OrgSubscription,
} from '@/src/lib/subscription-types'
import { useAuth } from '@/src/providers/AuthProvider'

export function useOrgSubscription() {
  const { user } = useAuth()
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (force = false) => {
    if (!user) {
      setOrg(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const record = await fetchOrgSubscription(force)
      setOrg(record)
    } catch {
      setOrg(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh(true)
  }, [refresh])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh(true)
    })
    return () => sub.remove()
  }, [refresh])

  const founding = org ? isFoundingMember(org) : false
  const active = org ? isSubscriptionActive(org) : true
  const daysLeft = org ? trialDaysLeft(org) : null
  const subscribed = isSubscribedOnStripe(org)
  const lapsed = !loading && !founding && !active

  const showTrialBanner =
    !loading &&
    !founding &&
    !subscribed &&
    daysLeft != null &&
    Number.isFinite(daysLeft) &&
    daysLeft <= 7

  return {
    org,
    loading,
    founding,
    active,
    lapsed,
    daysLeft,
    subscribed,
    showTrialBanner,
    refresh,
  }
}
