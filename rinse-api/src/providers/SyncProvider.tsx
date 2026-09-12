'use client'

import { useCallback, useEffect, useState } from 'react'
import OfflineBanner from '@/components/OfflineBanner'
import { useAuth } from '@/providers/AuthProvider'
import { getSyncStatus, resetBackend, syncOnReconnect, type SyncStatus } from '@/lib/api'

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [status, setStatus] = useState<SyncStatus | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await getSyncStatus())
  }, [])

  const handleSync = useCallback(async () => {
    await syncOnReconnect()
    resetBackend()
    await refresh()
  }, [refresh])

  useEffect(() => {
    refresh()

    const onOnline = () => { handleSync() }
    window.addEventListener('online', onOnline)

    const interval = setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('online', onOnline)
      clearInterval(interval)
    }
  }, [refresh, handleSync])

  return (
    <>
      {isLoggedIn && status ? <OfflineBanner status={status} onSync={handleSync} /> : null}
      {children}
    </>
  )
}
