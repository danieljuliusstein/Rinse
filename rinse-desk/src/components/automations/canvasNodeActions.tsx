import { createContext, useContext, type ReactNode } from 'react'
import type { AutomationNode, AutomationNodeData } from '@/lib/types'

export type CanvasNodeActions = {
  onEdit: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onAddAfter: (
    sourceId: string,
    type: AutomationNode['type'],
    data: AutomationNodeData,
  ) => void
}

const CanvasNodeActionsContext = createContext<CanvasNodeActions | null>(null)

export function CanvasNodeActionsProvider({
  value,
  children,
}: {
  value: CanvasNodeActions
  children: ReactNode
}) {
  return (
    <CanvasNodeActionsContext.Provider value={value}>{children}</CanvasNodeActionsContext.Provider>
  )
}

export function useCanvasNodeActions(): CanvasNodeActions {
  const ctx = useContext(CanvasNodeActionsContext)
  if (!ctx) {
    return {
      onEdit: () => {},
      onDuplicate: () => {},
      onDelete: () => {},
      onAddAfter: () => {},
    }
  }
  return ctx
}
