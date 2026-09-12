'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { navigateSettingsBack } from '@/lib/settings-navigation'

/** Back navigation for any screen under `/settings`. */
export function useSettingsBack() {
  const router = useRouter()
  const pathname = usePathname()
  return useCallback(() => {
    navigateSettingsBack(router, pathname)
  }, [router, pathname])
}
