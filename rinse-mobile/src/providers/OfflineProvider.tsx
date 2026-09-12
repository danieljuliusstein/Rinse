import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { QueueItem } from '@rinse/core'
import type { SyncResult } from '@/src/lib/offline/sync-runner'
import { runSyncOnce } from '@/src/lib/offline/sync-runner'
import { getOrganizationId } from '@/src/lib/org'
import { useAuth } from '@/src/providers/AuthProvider'
import * as queue from '@/src/lib/offline/queue'

interface OfflineContextValue {
  pendingCount: number
  items: QueueItem[]
  syncing: boolean
  lastError: string | null
  lastSync: SyncResult | null
  refresh: () => Promise<void>
  syncNow: () => Promise<SyncResult>
  enqueue: typeof queue.enqueue
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const orgId = getOrganizationId()
  const [pendingCount, setPendingCount] = useState(0)
  const [items, setItems] = useState<QueueItem[]>([])
  const [syncing, setSyncing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)

  const refresh = useCallback(async () => {
    if (!getOrganizationId()) {
      setPendingCount(0)
      setItems([])
      return
    }
    try {
      const [count, all] = await Promise.all([queue.getQueueCount(), queue.getQueueItems()])
      setPendingCount(count)
      setItems(all)
    } catch {
      setPendingCount(0)
      setItems([])
    }
  }, [])

  const syncNow = useCallback(async () => {
    setSyncing(true)
    setLastError(null)
    try {
      const result = await runSyncOnce()
      setLastSync(result)
      if (result.errors.length > 0) {
        setLastError(result.errors[result.errors.length - 1] ?? 'Sync failed')
      }
      await refresh()
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed'
      setLastError(msg)
      const remaining = await queue.getQueueCount()
      const failed: SyncResult = {
        processed: 0,
        failed: 1,
        remaining,
        errors: [msg],
        paused: false,
      }
      setLastSync(failed)
      return failed
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, user?.id, orgId, refresh])

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') return
      void (async () => {
        try {
          const count = await queue.getQueueCount()
          if (count > 0) await syncNow()
        } catch {
          // Errors surface via lastError on the offline context.
        }
      })()
    }
    const sub = AppState.addEventListener('change', onAppState)
    return () => sub.remove()
  }, [syncNow])

  const value = useMemo<OfflineContextValue>(
    () => ({
      pendingCount,
      items,
      syncing,
      lastError,
      lastSync,
      refresh,
      syncNow,
      enqueue: queue.enqueue,
    }),
    [pendingCount, items, syncing, lastError, lastSync, refresh, syncNow]
  )

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider')
  return ctx
}
