'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'
import BottomNav from './BottomNav'
import BusinessExpenseSheet from './business/BusinessExpenseSheet'
import SupplyPurchaseSheet from './business/SupplyPurchaseSheet'
import LeadSheet from './pipeline/LeadSheet'
import QuickActionMenu from './QuickActionMenu'
import ServiceWorkerCleanup from './ServiceWorkerCleanup'
import ProductTour from './ProductTour'
import RinseTourHost from './tour/RinseTourHost'
import PwaInstallBanner from './PwaInstallBanner'
import DemoModeBadge from './DemoModeBadge'
import TrialPlanBadge from './TrialPlanBadge'
import SubscriptionLapsedBanner from './SubscriptionLapsedBanner'
import { QuickActionProvider, useQuickAction } from '@/providers/QuickActionContext'
import SyncProvider from '@/providers/SyncProvider'
import { DetailOverlayProvider } from '@/providers/DetailOverlayProvider'
import { PaywallGateProvider } from '@/providers/PaywallGateProvider'
import { useAuth } from '@/providers/AuthProvider'
import { handleTourFinished } from '@/lib/product-tour'
import { getPackages } from '@/lib/api'
import type { Package } from '@/lib/types'

function QuickActionOverlays() {
  const {
    expenseSheetOpen,
    closeExpenseSheet,
    supplyPurchaseSheetOpen,
    closeSupplyPurchaseSheet,
    leadSheetOpen,
    leadToEdit,
    closeLeadSheet,
  } = useQuickAction()
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (!leadSheetOpen) return
    getPackages().then(setPackages)
  }, [leadSheetOpen])

  const handleLeadSaved = () => {
    window.dispatchEvent(new Event('leads-changed'))
  }

  return (
    <>
      <QuickActionMenu />
      {expenseSheetOpen && <BusinessExpenseSheet onClose={closeExpenseSheet} />}
      {supplyPurchaseSheetOpen && <SupplyPurchaseSheet onClose={closeSupplyPurchaseSheet} />}
      {leadSheetOpen && packages.length > 0 && (
        <LeadSheet
          lead={leadToEdit}
          packages={packages}
          onClose={closeLeadSheet}
          onSaved={handleLeadSaved}
        />
      )}
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoggedIn, isPlatformAdmin } = useAuth()
  const isPortal = pathname.startsWith('/portal')
  const isBook = pathname.startsWith('/book/')
  const isEmbed = pathname.startsWith('/embed/')
  const isDemo = pathname.startsWith('/demo')
  const isAdminPath = pathname.startsWith('/admin')
  const isAdminDemo = pathname.startsWith('/demo/admin-dashboard')
  const isAdminLane = isPlatformAdmin
  const isAdminConsole = isAdminLane || isAdminPath || isAdminDemo
  const isSettings = pathname.startsWith('/settings') || pathname === '/privacy'
  const isAuthFlow =
    pathname === '/auth' ||
    pathname === '/welcome' ||
    pathname === '/intro' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/')
  const isPublicClient = isPortal || isBook || isEmbed
  const showOperatorChrome = !isPublicClient && !isAuthFlow && !isDemo && !isAdminLane
  const showProductTour = showOperatorChrome && isLoggedIn

  const shellClass = [
    'app-shell',
    isPortal ? 'app-shell--portal' : '',
    isBook ? 'app-shell--book' : '',
    isEmbed ? 'app-shell--embed' : '',
    isSettings ? 'app-shell--settings' : '',
    isAuthFlow ? 'app-shell--auth-flow' : '',
    isAdminConsole ? 'app-shell--admin-demo' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <SyncProvider>
      <QuickActionProvider>
        <PaywallGateProvider>
        <DetailOverlayProvider>
        {showOperatorChrome ? (
          <NextTopLoader
            color="var(--text-dim)"
            height={3}
            showSpinner={false}
            zIndex={120}
            shadow="0 0 8px var(--text-dim), 0 0 4px var(--text-dim)"
          />
        ) : null}
        <ServiceWorkerCleanup />
        <div className={shellClass}>
          {!isPublicClient && !isAuthFlow ? (
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
          ) : null}
          {!isPublicClient && !isAuthFlow && isLoggedIn && !isDemo && !isAdminLane ? <SubscriptionLapsedBanner /> : null}
          {!isPublicClient && !isAuthFlow && isLoggedIn && !isDemo && !isAdminLane ? <TrialPlanBadge /> : null}
          {!isPublicClient && !isAuthFlow && isLoggedIn && !isDemo && !isAdminLane ? <DemoModeBadge /> : null}
          {!isPublicClient && !isAuthFlow && isLoggedIn && !isAdminConsole ? <PwaInstallBanner /> : null}
          <main id="main-content" className="app-shell__main" tabIndex={-1}>
            {children}
          </main>
          {!isDemo && !isAdminLane ? <BottomNav /> : null}
          {showProductTour ? <ProductTour /> : null}
          {showProductTour ? <RinseTourHost onTourEnd={handleTourFinished} /> : null}
          {!isPublicClient && !isDemo && !isAdminLane && <QuickActionOverlays />}
        </div>
        </DetailOverlayProvider>
        </PaywallGateProvider>
      </QuickActionProvider>
    </SyncProvider>
  )
}
