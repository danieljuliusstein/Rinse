'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import AccountAuth from '@/components/AccountAuth'
import { ADMIN_HOME } from '@/lib/route-lanes'

function AdminAuthPageInner() {
  const router = useRouter()

  return (
    <AccountAuth
      variant="admin"
      onAuthenticated={() => {
        router.replace(ADMIN_HOME)
      }}
    />
  )
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
