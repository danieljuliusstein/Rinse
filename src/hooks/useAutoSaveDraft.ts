import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import {
  clearDraft as clearDraftStore,
  loadDraft,
  saveDraft,
  type DraftEntity,
} from '@/src/lib/offline/drafts'

const DEFAULT_DEBOUNCE_MS = 300

function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

export interface UseAutoSaveDraftOptions<T> {
  entity: DraftEntity
  entityId: string
  value: T
  /** When false, skip load/save (e.g. while form metadata is loading). */
  enabled?: boolean
  debounceMs?: number
  /** Skip persist when payload is "empty" — defaults to always save. */
  isEmpty?: (value: T) => boolean
}

export interface UseAutoSaveDraftResult<T> {
  /** Hydrated draft payload, if any. Null after clear or when none existed. */
  restored: T | null
  restoredAt: string | null
  /** True after the initial SQLite/memory load finishes. */
  hydrated: boolean
  hasDraft: boolean
  clearDraft: () => Promise<void>
  flushDraft: () => Promise<void>
}

/**
 * Local-first draft persistence: debounce every change, flush on background/unmount.
 * Survives crash / force-quit via org-scoped SQLite (native) or memory (web preview).
 */
export function useAutoSaveDraft<T>({
  entity,
  entityId,
  value,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  isEmpty,
}: UseAutoSaveDraftOptions<T>): UseAutoSaveDraftResult<T> {
  const [restored, setRestored] = useState<T | null>(null)
  const [restoredAt, setRestoredAt] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  const valueRef = useRef(value)
  valueRef.current = value
  const lastSavedRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(
    async (next: T) => {
      if (!enabled) return
      if (isEmpty?.(next)) {
        await clearDraftStore(entity, entityId)
        lastSavedRef.current = ''
        setHasDraft(false)
        return
      }
      const serialized = stableStringify(next)
      if (!serialized || serialized === lastSavedRef.current) return
      await saveDraft(entity, entityId, next)
      lastSavedRef.current = serialized
      setHasDraft(true)
    },
    [enabled, entity, entityId, isEmpty]
  )

  const flushDraft = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await persist(valueRef.current)
  }, [persist])

  const clearDraft = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await clearDraftStore(entity, entityId)
    lastSavedRef.current = ''
    setRestored(null)
    setRestoredAt(null)
    setHasDraft(false)
  }, [entity, entityId])

  // Hydrate once per entity key
  useEffect(() => {
    let cancelled = false
    setHydrated(false)
    setRestored(null)
    setRestoredAt(null)
    setHasDraft(false)

    if (!enabled) {
      return () => {
        cancelled = true
      }
    }

    void loadDraft<T>(entity, entityId).then((draft) => {
      if (cancelled) return
      if (draft) {
        setRestored(draft.payload)
        setRestoredAt(draft.updatedAt)
        setHasDraft(true)
        lastSavedRef.current = stableStringify(draft.payload)
      } else {
        setHasDraft(false)
        lastSavedRef.current = ''
      }
      setHydrated(true)
    })

    return () => {
      cancelled = true
    }
  }, [entity, entityId, enabled])

  // Debounced save on value changes (after hydrate)
  useEffect(() => {
    if (!enabled || !hydrated) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void persist(value)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [value, enabled, hydrated, debounceMs, persist])

  // Flush when the form closes (enabled true → false) so sheet dismiss still persists.
  const wasEnabledRef = useRef(false)
  useEffect(() => {
    if (wasEnabledRef.current && !enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const next = valueRef.current
      if (isEmpty?.(next)) {
        void clearDraftStore(entity, entityId)
        lastSavedRef.current = ''
        setHasDraft(false)
      } else {
        const serialized = stableStringify(next)
        if (serialized && serialized !== lastSavedRef.current) {
          void saveDraft(entity, entityId, next)
          lastSavedRef.current = serialized
          setHasDraft(true)
        }
      }
    }
    wasEnabledRef.current = enabled
  }, [enabled, entity, entityId, isEmpty])

  // Flush on background
  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        void flushDraft()
      }
    }
    const sub = AppState.addEventListener('change', onAppState)
    return () => sub.remove()
  }, [flushDraft])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      void persist(valueRef.current)
    }
  }, [persist])

  return {
    restored,
    restoredAt,
    hydrated,
    hasDraft,
    clearDraft,
    flushDraft,
  }
}
