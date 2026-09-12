'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { computeProfileCompletion, type ProfileCompletion } from '@/lib/profile-completion'
import { loadSettingsAsync } from '@/lib/settings'

export function useProfileCompletion(): ProfileCompletion | null {
  const pathname = usePathname()
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadSettingsAsync().then((settings) => {
      if (!cancelled) setCompletion(computeProfileCompletion(settings))
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  return completion
}
