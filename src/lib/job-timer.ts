import { getSecureItem, setSecureItem } from './secure-storage'

const STORAGE_KEY = 'rinse_job_timers_v1'

interface TimerState {
  startedAt: number
  accumulatedMs: number
}

type TimerMap = Record<string, TimerState>

async function readMap(): Promise<TimerMap> {
  try {
    const raw = await getSecureItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TimerMap) : {}
  } catch {
    return {}
  }
}

async function writeMap(map: TimerMap): Promise<void> {
  await setSecureItem(STORAGE_KEY, JSON.stringify(map))
}

export async function getJobTimer(jobId: string): Promise<{ running: boolean; elapsedMs: number }> {
  const map = await readMap()
  const state = map[jobId]
  if (!state) return { running: false, elapsedMs: 0 }
  const running = state.startedAt > 0
  const live = running ? Date.now() - state.startedAt : 0
  return { running, elapsedMs: state.accumulatedMs + live }
}

export async function startJobTimer(jobId: string): Promise<void> {
  const map = await readMap()
  const prev = map[jobId] ?? { startedAt: 0, accumulatedMs: 0 }
  if (prev.startedAt > 0) return
  map[jobId] = { ...prev, startedAt: Date.now() }
  await writeMap(map)
}

export async function stopJobTimer(jobId: string): Promise<number> {
  const map = await readMap()
  const prev = map[jobId] ?? { startedAt: 0, accumulatedMs: 0 }
  let total = prev.accumulatedMs
  if (prev.startedAt > 0) total += Date.now() - prev.startedAt
  map[jobId] = { startedAt: 0, accumulatedMs: total }
  await writeMap(map)
  return total
}

export async function resetJobTimer(jobId: string): Promise<void> {
  const map = await readMap()
  delete map[jobId]
  await writeMap(map)
}

export function formatElapsedMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
