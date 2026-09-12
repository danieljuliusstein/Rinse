'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

/** Redirect create/edit flows to sign-in when logged out. */
export function useRequireSignIn(): boolean {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn) return
    queueMicrotask(() => {
      router.replace('/auth')
    })
  }, [isLoggedIn, router])

  return isLoggedIn
}
