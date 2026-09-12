import { useCallback, useEffect, useState } from 'react'
import {
  formatElapsedMs,
  getJobTimer,
  resetJobTimer,
  startJobTimer,
  stopJobTimer,
} from '@/src/lib/job-timer'
import { successHaptic } from '@/src/lib/haptics'

export function useJobTimer(jobId: string, onStopped?: (hours: number) => void) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      const state = await getJobTimer(jobId)
      if (!cancelled) {
        setElapsedMs(state.elapsedMs)
        setRunning(state.running)
      }
    }
    void sync()
    const id = setInterval(() => void sync(), 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [jobId])

  const start = useCallback(() => {
    void startJobTimer(jobId).then(() => setRunning(true))
  }, [jobId])

  const stop = useCallback(() => {
    void stopJobTimer(jobId).then((total) => {
      setElapsedMs(total)
      setRunning(false)
      void successHaptic()
      onStopped?.(total / 3_600_000)
    })
  }, [jobId, onStopped])

  const reset = useCallback(() => {
    void resetJobTimer(jobId).then(() => {
      setElapsedMs(0)
      setRunning(false)
    })
  }, [jobId])

  const toggle = useCallback(() => {
    if (running) stop()
    else start()
  }, [running, start, stop])

  return {
    elapsedMs,
    running,
    formatted: formatElapsedMs(elapsedMs),
    start,
    stop,
    reset,
    toggle,
  }
}
