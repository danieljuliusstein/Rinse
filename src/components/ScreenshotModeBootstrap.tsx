import { useEffect } from 'react'
import { Platform } from 'react-native'
import { isScreenshotMode } from '@/src/lib/screenshot-mode'

/** Web-only: adds `screenshot-mode` on `<body>` when `?screenshot=1` is present. */
export function ScreenshotModeBootstrap() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const enabled = isScreenshotMode()
    document.body.classList.toggle('screenshot-mode', enabled)
    return () => {
      document.body.classList.remove('screenshot-mode')
    }
  }, [])

  return null
}
