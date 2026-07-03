'use client'

import { useEffect, useState } from 'react'
import { isDemoModeEnabled } from '@/lib/demo-mode'

export default function DemoModeBadge() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const sync = () => setOn(isDemoModeEnabled())
    sync()
    window.addEventListener('demo-mode-changed', sync)
    return () => window.removeEventListener('demo-mode-changed', sync)
  }, [])

  if (!on) return null

  return (
    <div className="demo-mode-badge" role="status">
      Sample business
    </div>
  )
}
