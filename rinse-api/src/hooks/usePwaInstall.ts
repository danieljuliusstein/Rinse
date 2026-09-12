'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  bindPwaInstallPrompt,
  canShowInstallPrompt,
  dismissInstallPrompt,
  hasDeferredInstallPrompt,
  isIos,
  isStandalonePwa,
  promptPwaInstall,
  subscribeInstallPrompt,
} from '@/lib/pwa-install'

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)

  const refresh = useCallback(() => {
    setIsStandalone(isStandalonePwa())
    setIsIosDevice(isIos())
    setCanInstall(canShowInstallPrompt())
  }, [])

  useEffect(() => {
    bindPwaInstallPrompt()
    refresh()
    return subscribeInstallPrompt(refresh)
  }, [refresh])

  const install = useCallback(async () => {
    const result = await promptPwaInstall()
    refresh()
    return result
  }, [refresh])

  const dismiss = useCallback(() => {
    dismissInstallPrompt()
    refresh()
  }, [refresh])

  return {
    canInstall,
    isStandalone,
    isIosDevice,
    hasNativePrompt: hasDeferredInstallPrompt(),
    install,
    dismiss,
    refresh,
  }
}
