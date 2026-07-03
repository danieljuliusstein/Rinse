'use client'

import { useCallback, useEffect, useState } from 'react'
import { isRinseTourActive, subscribeRinseTour } from '@/lib/rinse-tour/controller'
import RinseTourOverlay from './RinseTourOverlay'

interface RinseTourHostProps {
  onTourEnd: () => void
}

export default function RinseTourHost({ onTourEnd }: RinseTourHostProps) {
  const [mounted, setMounted] = useState(isRinseTourActive())

  useEffect(() => {
    return subscribeRinseTour((state) => {
      if (state.active) setMounted(true)
    })
  }, [])

  const handleDismiss = useCallback(() => {
    setMounted(false)
  }, [])

  if (!mounted) return null

  return <RinseTourOverlay onFinished={onTourEnd} onDismiss={handleDismiss} />
}
