'use client'

import { ShareNetwork } from '@phosphor-icons/react'
import { VaulSheet } from '@/components/ui'

interface IosInstallSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function IosInstallSheet({ open, onOpenChange }: IosInstallSheetProps) {
  return (
    <VaulSheet open={open} onOpenChange={onOpenChange} title="Install on iPhone">
      <ol className="ios-install-steps">
        <li>
          Tap <ShareNetwork size={16} weight="bold" className="ios-install-steps__icon" aria-hidden="true" />{' '}
          <strong>Share</strong> in Safari
        </li>
        <li>
          Scroll and tap <strong>Add to Home Screen</strong>
        </li>
        <li>
          Tap <strong>Add</strong> — Rinse opens like a native app
        </li>
      </ol>
      <p className="ios-install-steps__hint">Install works best in Safari (not an in-app browser).</p>
    </VaulSheet>
  )
}
