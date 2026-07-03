const STORAGE_KEY = 'rinse_job_timers_v1'

interface TimerState {
  startedAt: number
  accumulatedMs: number
}

type TimerMap = Record<string, TimerState>

function readMap(): TimerMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TimerMap) : {}
  } catch {
    return {}
  }
}

function writeMap(map: TimerMap): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getJobTimer(jobId: string): { running: boolean; elapsedMs: number } {
  const map = readMap()
  const state = map[jobId]
  if (!state) return { running: false, elapsedMs: 0 }
  const running = state.startedAt > 0
  const live = running ? Date.now() - state.startedAt : 0
  return { running, elapsedMs: state.accumulatedMs + live }
}

export function startJobTimer(jobId: string): void {
  const map = readMap()
  const prev = map[jobId] ?? { startedAt: 0, accumulatedMs: 0 }
  if (prev.startedAt > 0) return
  map[jobId] = { ...prev, startedAt: Date.now() }
  writeMap(map)
}

export function stopJobTimer(jobId: string): number {
  const map = readMap()
  const prev = map[jobId] ?? { startedAt: 0, accumulatedMs: 0 }
  let total = prev.accumulatedMs
  if (prev.startedAt > 0) total += Date.now() - prev.startedAt
  map[jobId] = { startedAt: 0, accumulatedMs: total }
  writeMap(map)
  return total
}

export function resetJobTimer(jobId: string): void {
  const map = readMap()
  delete map[jobId]
  writeMap(map)
}

export function formatElapsedMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function totalTrackedHours(jobIds: string[]): number {
  let ms = 0
  for (const id of jobIds) ms += getJobTimer(id).elapsedMs
  return ms / 3_600_000
}
