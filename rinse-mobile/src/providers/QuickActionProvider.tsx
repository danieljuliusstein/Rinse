import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface QuickActionContextValue {
  menuOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  expenseSheetOpen: boolean
  openExpenseSheet: () => void
  closeExpenseSheet: () => void
  supplySheetOpen: boolean
  openSupplyPurchaseSheet: () => void
  closeSupplySheet: () => void
  leadSheetOpen: boolean
  openLeadSheet: () => void
  closeLeadSheet: () => void
}

const QuickActionContext = createContext<QuickActionContextValue | null>(null)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [supplySheetOpen, setSupplySheetOpen] = useState(false)
  const [leadSheetOpen, setLeadSheetOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openMenu = useCallback(() => setMenuOpen(true), [])
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])

  const value = useMemo<QuickActionContextValue>(
    () => ({
      menuOpen,
      openMenu,
      closeMenu,
      toggleMenu,
      expenseSheetOpen,
      openExpenseSheet: () => {
        setMenuOpen(false)
        setExpenseSheetOpen(true)
      },
      closeExpenseSheet: () => setExpenseSheetOpen(false),
      supplySheetOpen,
      openSupplyPurchaseSheet: () => {
        setMenuOpen(false)
        setSupplySheetOpen(true)
      },
      closeSupplySheet: () => setSupplySheetOpen(false),
      leadSheetOpen,
      openLeadSheet: () => {
        setMenuOpen(false)
        setLeadSheetOpen(true)
      },
      closeLeadSheet: () => setLeadSheetOpen(false),
    }),
    [menuOpen, openMenu, closeMenu, toggleMenu, expenseSheetOpen, supplySheetOpen, leadSheetOpen]
  )

  return <QuickActionContext.Provider value={value}>{children}</QuickActionContext.Provider>
}

export function useQuickAction() {
  const ctx = useContext(QuickActionContext)
  if (!ctx) throw new Error('useQuickAction must be used within QuickActionProvider')
  return ctx
}
