'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, FileText, Flask, Funnel, Receipt } from '@phosphor-icons/react'
import { useQuickAction } from '@/providers/QuickActionContext'
import { useAuth } from '@/providers/AuthProvider'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock'
import { trapFocus } from '@/lib/focus-trap'

interface ActionItem {
  id: string
  label: string
  subtitle: string
  Icon: typeof Briefcase
  onSelect: () => void
}

export default function QuickActionMenu() {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)
  const { isLoggedIn } = useAuth()
  const { menuOpen, closeMenu, openExpenseSheet, openSupplyPurchaseSheet, openLeadSheet } =
    useQuickAction()

  const requireSignIn = () => {
    closeMenu()
    router.push('/auth')
  }

  const actions: ActionItem[] = [
    {
      id: 'new-lead',
      label: 'New lead',
      subtitle: 'Capture an inquiry before they are a client',
      Icon: Funnel,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        closeMenu()
        openLeadSheet()
      },
    },
    {
      id: 'new-job',
      label: 'New job',
      subtitle: 'Schedule a detail and log revenue',
      Icon: Briefcase,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        closeMenu()
        router.push('/jobs/new')
      },
    },
    {
      id: 'new-invoice',
      label: 'Create invoice',
      subtitle: 'Open a job and send an invoice',
      Icon: Receipt,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        closeMenu()
        router.push('/invoices/new')
      },
    },
    {
      id: 'log-expense',
      label: 'Log business expense',
      subtitle: 'One-time payment like LLC renewal',
      Icon: Receipt,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        openExpenseSheet()
      },
    },
    {
      id: 'buy-supplies',
      label: 'Buy supplies',
      subtitle: 'Chemicals and consumables → expense + inventory',
      Icon: Flask,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        openSupplyPurchaseSheet()
      },
    },
    {
      id: 'new-quote',
      label: 'New quote',
      subtitle: 'Send a price estimate to a client',
      Icon: FileText,
      onSelect: () => {
        if (!isLoggedIn) return requireSignIn()
        closeMenu()
        router.push('/quotes/new')
      },
    },
  ]

  useEffect(() => {
    if (!menuOpen) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    let releaseFocus: (() => void) | undefined
    const frame = window.requestAnimationFrame(() => {
      if (sheetRef.current) {
        releaseFocus = trapFocus(sheetRef.current, '.quick-action-row')
      }
    })
    return () => {
      window.cancelAnimationFrame(frame)
      releaseFocus?.()
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, closeMenu])

  if (!menuOpen) return null

  return (
    <div className="quick-action-root" role="presentation">
      <button
        type="button"
        className="quick-action-backdrop"
        onClick={closeMenu}
        aria-label="Close quick actions"
      />
      <div
        ref={sheetRef}
        className="quick-action-sheet"
        role="menu"
        aria-label="Quick actions"
        data-tour="quick-action-sheet"
      >
        <div className="quick-action-sheet-handle" />
        <div className="quick-action-sheet-title">Quick actions</div>
        {actions.map((action) => {
          const { Icon } = action
          return (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="quick-action-row"
              data-tour={`quick-action-row-${action.id}`}
              onClick={action.onSelect}
            >
              <span className="quick-action-row-icon">
                <Icon size={22} weight="duotone" color="var(--green)" aria-hidden="true" />
              </span>
              <span className="quick-action-row-text">
                <span className="quick-action-row-label">{action.label}</span>
                <span className="quick-action-row-subtitle">{action.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
