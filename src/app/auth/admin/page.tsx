'use client'

import { Suspense } from 'react'
import AccountAuth from '@/components/AccountAuth'
import { ADMIN_HOME } from '@/lib/route-lanes'

function AdminAuthPageInner() {
  return (
    <AccountAuth
      variant="admin"
      onAuthenticated={() => {
        hardReplace(ADMIN_HOME)
      }}
    />
  )
}

function hardReplace(href: string) {
  if (typeof window === 'undefined') return
  window.location.replace(href)
}

export default function AdminAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading-screen">
          <div className="auth-loading-text">Loading…</div>
        </div>
      }
    >
      <AdminAuthPageInner />
    </Suspense>
  )
}
