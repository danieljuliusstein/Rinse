import PocketBase from 'pocketbase'

let pb: PocketBase | null = null

/** PocketBase host. Still on Fly — not proxied via rinsehq.com / desk.rinsehq.com. */
const DEFAULT_PB_URL = 'https://detailing-pb.fly.dev'

export function getPbUrl(): string {
  const raw = (import.meta.env.VITE_PB_URL as string | undefined)?.trim()
  if (!raw) return DEFAULT_PB_URL
  return raw.replace(/\/$/, '')
}

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(getPbUrl())
    pb.autoCancellation(false)
  }
  return pb
}

export async function checkPocketBaseHealth(timeoutMs = 8000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${getPbUrl()}/api/health`, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}
