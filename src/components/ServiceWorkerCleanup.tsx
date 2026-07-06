'use client'

import { useEffect } from 'react'

const CHUNK_ERROR_RE =
  /loading chunk|chunkloaderror|failed to fetch dynamically imported module|importing a module script failed/i

function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false
  if (typeof reason === 'string') return CHUNK_ERROR_RE.test(reason)
  if (reason instanceof Error) return CHUNK_ERROR_RE.test(reason.message)
  return false
}

/** Dev: unregister stale SW. Prod: auto-reload once when a stale SW serves broken chunks (common on iOS PWA). */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (!('serviceWorker' in navigator)) return

      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister().catch(() => {})
        }
      })

      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.includes('workbox') || key.includes('next-pwa')) {
              caches.delete(key).catch(() => {})
            }
          }
        })
      }
      return
    }

    const reloadOnceForChunkError = () => {
      if (typeof window === 'undefined') return
      const key = 'rinse_chunk_reload'
      if (sessionStorage.getItem(key) === '1') return
      sessionStorage.setItem(key, '1')
      window.location.reload()
    }

    const onWindowError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message) || isChunkLoadError(event.error)) {
        reloadOnceForChunkError()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        reloadOnceForChunkError()
      }
    }

    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        reloadOnceForChunkError()
      })
    }

    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
