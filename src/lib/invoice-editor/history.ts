import { useCallback, useRef, useState } from 'react'
import type { InvoiceEditorLayout } from './types'

const MAX_HISTORY = 50

export function useEditorHistory(initial: InvoiceEditorLayout) {
  const [layout, setLayoutState] = useState(initial)
  const pastRef = useRef<InvoiceEditorLayout[]>([])
  const futureRef = useRef<InvoiceEditorLayout[]>([])
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  /** Commit a layout change onto the undo stack. */
  const setLayout = useCallback(
    (updater: InvoiceEditorLayout | ((prev: InvoiceEditorLayout) => InvoiceEditorLayout)) => {
      const prev = layoutRef.current
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next === prev) return

      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev]
      futureRef.current = []
      layoutRef.current = next
      setLayoutState(next)
      syncFlags()
    },
    [syncFlags],
  )

  /** Update layout without recording history (e.g. live drag frames). */
  const setLayoutLive = useCallback(
    (updater: InvoiceEditorLayout | ((prev: InvoiceEditorLayout) => InvoiceEditorLayout)) => {
      const prev = layoutRef.current
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next === prev) return
      layoutRef.current = next
      setLayoutState(next)
    },
    [],
  )

  /**
   * Push `before` onto undo (once), then keep `after` as current without
   * stacking intermediate frames. Used to commit a drag gesture.
   */
  const commitFrom = useCallback(
    (before: InvoiceEditorLayout, after: InvoiceEditorLayout) => {
      if (before === after) return
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), before]
      futureRef.current = []
      layoutRef.current = after
      setLayoutState(after)
      syncFlags()
    },
    [syncFlags],
  )

  const undo = useCallback(() => {
    const past = pastRef.current
    if (past.length === 0) return
    const previous = past[past.length - 1]!
    pastRef.current = past.slice(0, -1)
    futureRef.current = [layoutRef.current, ...futureRef.current]
    layoutRef.current = previous
    setLayoutState(previous)
    syncFlags()
  }, [syncFlags])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    const next = future[0]!
    futureRef.current = future.slice(1)
    pastRef.current = [...pastRef.current, layoutRef.current]
    layoutRef.current = next
    setLayoutState(next)
    syncFlags()
  }, [syncFlags])

  const resetHistory = useCallback(
    (next: InvoiceEditorLayout) => {
      pastRef.current = []
      futureRef.current = []
      layoutRef.current = next
      setLayoutState(next)
      syncFlags()
    },
    [syncFlags],
  )

  return {
    layout,
    layoutRef,
    setLayout,
    setLayoutLive,
    commitFrom,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  }
}
