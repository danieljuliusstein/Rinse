'use client'

import { useDetailOverlay } from '@/providers/DetailOverlayProvider'

export function useDetailNavigation() {
  const overlay = useDetailOverlay()

  return {
    openJob: (id: string) => overlay.open({ kind: 'job', id }, `job-${id}`),
    openClient: (id: string) => overlay.open({ kind: 'client', id }, `client-${id}`),
    openInvoice: (jobId: string) => overlay.open({ kind: 'invoice', jobId }, `invoice-${jobId}`),
    close: overlay.close,
    isOpen: overlay.isOpen,
  }
}
