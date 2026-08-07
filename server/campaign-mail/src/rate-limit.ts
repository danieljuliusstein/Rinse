/** Simple in-memory sliding-window rate limiter (single instance). */

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Allow at most `limit` events in the last `windowMs` for `key`.
 * Prunes old timestamps on each check.
 */
export function takeToken(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (limit <= 0) return { ok: true, remaining: Infinity, retryAfterSec: 0 }

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }

  const cutoff = now - windowMs
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { ok: false, remaining: 0, retryAfterSec }
  }

  bucket.timestamps.push(now)
  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterSec: 0,
  }
}

/** Test helper */
export function resetRateLimits() {
  buckets.clear()
}
