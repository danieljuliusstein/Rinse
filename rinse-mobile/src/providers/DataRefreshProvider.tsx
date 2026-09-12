import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

interface RefreshContextValue {
  tick: number
  bump: () => void
}

const RefreshContext = createContext<RefreshContextValue | null>(null)

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0)

  const bump = useCallback(() => {
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') bump()
    }
    const sub = AppState.addEventListener('change', onAppState)
    return () => sub.remove()
  }, [bump])

  const value = useMemo(() => ({ tick, bump }), [tick, bump])
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}

export function useDataRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useDataRefresh must be used within DataRefreshProvider')
  return ctx
}
