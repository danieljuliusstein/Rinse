'use client'

import { useState } from 'react'
import { ArrowsClockwise, CloudSlash } from '@phosphor-icons/react'
import type { SyncStatus } from '@/lib/api'

export default function OfflineBanner({
  status,
  onSync,
}: {
  status: SyncStatus
  onSync: () => Promise<void>
}) {
  const [syncing, setSyncing] = useState(false)

  const show =
    status.pendingWrites > 0 ||
    (status.pocketBaseConfigured && !status.pocketBaseHealthy && status.online === false) ||
    (status.pocketBaseConfigured && !status.pocketBaseHealthy)

  if (!show) return null

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync()
    } finally {
      setSyncing(false)
    }
  }

  const message = !status.online
    ? 'Offline — changes saved locally'
    : status.pendingWrites > 0
      ? `${status.pendingWrites} change${status.pendingWrites === 1 ? '' : 's'} waiting to sync`
      : 'PocketBase unavailable — using local data'

  const showSync = status.online && status.pendingWrites > 0

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <CloudSlash size={18} color="var(--amber)" weight="fill" aria-hidden="true" />
      <span className="offline-banner__message">{message}</span>
      {showSync ? (
        <button
          type="button"
          className={[
            'offline-banner__sync',
            status.pendingWrites > 0 && !syncing ? 'offline-banner__sync--pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => void handleSync()}
          disabled={syncing}
        >
          <ArrowsClockwise size={14} weight="bold" aria-hidden="true" />
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      ) : null}
    </div>
  )
}
