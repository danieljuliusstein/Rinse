'use client'

import { useEffect, useState } from 'react'
import { Clock, Pause, Play, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import {
  formatElapsedMs,
  getJobTimer,
  resetJobTimer,
  startJobTimer,
  stopJobTimer,
} from '@/lib/job-timer'
import { successHaptic } from '@/lib/haptics'

interface JobTimerProps {
  jobId: string
  onStopped?: (hours: number) => void
}

export default function JobTimer({ jobId, onStopped }: JobTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const sync = () => {
      const state = getJobTimer(jobId)
      setElapsedMs(state.elapsedMs)
      setRunning(state.running)
    }
    sync()
    const id = window.setInterval(sync, 1000)
    return () => window.clearInterval(id)
  }, [jobId])

  const handleStart = () => {
    startJobTimer(jobId)
    setRunning(true)
  }

  const handleStop = () => {
    const total = stopJobTimer(jobId)
    setElapsedMs(total)
    setRunning(false)
    successHaptic()
    onStopped?.(total / 3_600_000)
  }

  const handleReset = () => {
    resetJobTimer(jobId)
    setElapsedMs(0)
    setRunning(false)
  }

  return (
    <div className="card job-timer-card">
      <div className="job-timer-card__head">
        <Clock size={18} weight="duotone" aria-hidden="true" />
        <span className="section-title">Time on job</span>
      </div>
      <div className="job-timer-card__display" aria-live="polite">
        {formatElapsedMs(elapsedMs)}
      </div>
      <div className="job-timer-card__actions">
        {running ? (
          <Button variant="secondary" fullWidth onClick={handleStop}>
            <Pause size={18} weight="fill" aria-hidden="true" /> Stop
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={handleStart}>
            <Play size={18} weight="fill" aria-hidden="true" /> Start timer
          </Button>
        )}
        {elapsedMs > 0 && !running ? (
          <Button variant="ghost" fullWidth onClick={handleReset}>
            <ArrowCounterClockwise size={16} aria-hidden="true" /> Reset
          </Button>
        ) : null}
      </div>
    </div>
  )
}
