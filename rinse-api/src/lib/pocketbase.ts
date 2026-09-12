import PocketBase from 'pocketbase'
import { withTimeout } from './timeout'

let pb: PocketBase | null = null

export function getPocketBase(): PocketBase | null {
  const url = process.env.NEXT_PUBLIC_PB_URL
  if (!url) return null

  if (!pb) {
    pb = new PocketBase(url)
    pb.autoCancellation(false)
  }
  return pb
}

export function isPocketBaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PB_URL
}

export async function checkPocketBaseHealth(timeoutMs = 8000): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_PB_URL
  if (!url) return false

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${url}/api/health`, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

/** Verify app collections exist (health alone only checks the server is up). */
export async function checkPocketBaseSchema(timeoutMs = 8000): Promise<{ ok: boolean; error?: string }> {
  const pb = getPocketBase()
  if (!pb?.authStore.isValid) return { ok: false, error: 'not_authenticated' }

  try {
    await withTimeout(pb.collection('jobs').getList(1, 1), timeoutMs, 'PocketBase schema probe')
    return { ok: true }
  } catch (err) {
    const e = err as { status?: number; message?: string }
    return { ok: false, error: `${e.status ?? '?'}: ${e.message ?? String(err)}` }
  }
}
