'use client'

import { useState } from 'react'
import { DeviceMobile, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import IosInstallSheet from './IosInstallSheet'

export default function PwaInstallBanner() {
  const { canInstall, isIosDevice, hasNativePrompt, install, dismiss } = usePwaInstall()
  const [iosOpen, setIosOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!canInstall) return null

  const handleInstall = async () => {
    if (isIosDevice && !hasNativePrompt) {
      setIosOpen(true)
      return
    }
    setBusy(true)
    try {
      const result = await install()
      if (result === 'dismissed') dismiss()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label="Install app">
        <span className="pwa-install-banner__icon" aria-hidden="true">
          <DeviceMobile size={22} weight="duotone" />
        </span>
        <div className="pwa-install-banner__body">
          <strong>Install Rinse</strong>
          <span>Add to your home screen for faster access and offline support.</span>
        </div>
        <div className="pwa-install-banner__actions">
          <Button variant="primary" className="pwa-install-banner__btn" disabled={busy} onClick={() => void handleInstall()}>
            Install
          </Button>
          <button type="button" className="pwa-install-banner__dismiss" onClick={dismiss} aria-label="Dismiss install prompt">
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>
      <IosInstallSheet open={iosOpen} onOpenChange={setIosOpen} />
    </>
  )
}
