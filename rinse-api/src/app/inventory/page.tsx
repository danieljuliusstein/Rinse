'use client'

import { Suspense } from 'react'
import InventoryPage from '@/components/inventory/InventoryPage'

export default function InventoryRoute() {
  return (
    <Suspense fallback={null}>
      <InventoryPage />
    </Suspense>
  )
}
