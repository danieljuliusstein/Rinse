'use client'

import { useCallback, useState } from 'react'
import { isRinseTourActive, subscribeRinseTour } from '@/lib/rinse-tour/controller'
import { useEffect } from 'react'
import RinseTourOverlay from './RinseTourOverlay'

interface RinseTourHostProps {
  onTourEnd: () => void
}

export default function RinseTourHost({ onTourEnd }: RinseTourHostProps) {
  const [visible, setVisible] = useState(isRinseTourActive())

  useEffect(() => {
    return subscribeRinseTour((state) => {
      setVisible(state.active)
    })
  }, [])

  const handleFinished = useCallback(() => {
    setVisible(false)
    onTourEnd()
  }, [onTourEnd])

  if (!visible) return null

  return <RinseTourOverlay onFinished={handleFinished} />
}
