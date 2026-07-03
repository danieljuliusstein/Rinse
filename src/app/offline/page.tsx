'use client'

import { WifiSlash } from '@phosphor-icons/react'
import { Button, EmptyState } from '@/components/ui'

export default function OfflinePage() {
  return (
    <div className="screen page-content body offline-screen">
      <EmptyState
        icon={<WifiSlash size={48} weight="duotone" className="offline-screen__icon" aria-hidden="true" />}
        title="You're offline"
        description="Reconnect to sync your latest data."
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
      <div className="offline-screen__hint">
        <Button variant="ghost" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}
