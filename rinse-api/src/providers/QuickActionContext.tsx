'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Lead } from '@/lib/types'

interface QuickActionContextValue {
  menuOpen: boolean
  expenseSheetOpen: boolean
  supplyPurchaseSheetOpen: boolean
  leadSheetOpen: boolean
  leadToEdit: Lead | null
  openMenu: () => void
  closeMenu: () => void
  openExpenseSheet: () => void
  closeExpenseSheet: () => void
  openSupplyPurchaseSheet: () => void
  closeSupplyPurchaseSheet: () => void
  openLeadSheet: (lead?: Lead) => void
  closeLeadSheet: () => void
}

const QuickActionContext = createContext<QuickActionContextValue | null>(null)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [supplyPurchaseSheetOpen, setSupplyPurchaseSheetOpen] = useState(false)
  const [leadSheetOpen, setLeadSheetOpen] = useState(false)
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)

  const openMenu = useCallback(() => setMenuOpen(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openExpenseSheet = useCallback(() => {
    setMenuOpen(false)
    setExpenseSheetOpen(true)
  }, [])
  const closeExpenseSheet = useCallback(() => setExpenseSheetOpen(false), [])
  const openSupplyPurchaseSheet = useCallback(() => {
    setMenuOpen(false)
    setSupplyPurchaseSheetOpen(true)
  }, [])
  const closeSupplyPurchaseSheet = useCallback(() => setSupplyPurchaseSheetOpen(false), [])
  const openLeadSheet = useCallback((lead?: Lead) => {
    setMenuOpen(false)
    setLeadToEdit(lead ?? null)
    setLeadSheetOpen(true)
  }, [])
  const closeLeadSheet = useCallback(() => {
    setLeadSheetOpen(false)
    setLeadToEdit(null)
  }, [])

  return (
    <QuickActionContext.Provider
      value={{
        menuOpen,
        expenseSheetOpen,
        supplyPurchaseSheetOpen,
        leadSheetOpen,
        leadToEdit,
        openMenu,
        closeMenu,
        openExpenseSheet,
        closeExpenseSheet,
        openSupplyPurchaseSheet,
        closeSupplyPurchaseSheet,
        openLeadSheet,
        closeLeadSheet,
      }}
    >
      {children}
    </QuickActionContext.Provider>
  )
}

export function useQuickAction() {
  const ctx = useContext(QuickActionContext)
  if (!ctx) throw new Error('useQuickAction must be used within QuickActionProvider')
  return ctx
}
