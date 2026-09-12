'use client'

import { useAuth } from '@/providers/AuthProvider'

export function useAuthEmptyState() {
  const { isLoggedIn } = useAuth()
  return {
    isLoggedIn,
    isLoggedOut: !isLoggedIn,
    signInHref: '/auth',
    signUpHref: '/auth?mode=signup',
  }
}
