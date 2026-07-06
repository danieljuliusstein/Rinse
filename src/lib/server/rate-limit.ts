import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSec?: number
}

const buckets = new Map<string, { count: number; reset: number }>()

let redisClient: Redis | null | undefined
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    redisClient = null
    return null
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

export function isUpstashRateLimitEnabled(): boolean {
  return getUpstashRedis() !== null
}

function windowMsToDuration(windowMs: number): `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000
  const minute = 60 * 1000
  if (windowMs >= day && windowMs % day === 0) return `${windowMs / day} d`
  if (windowMs >= hour && windowMs % hour === 0) return `${windowMs / hour} h`
  if (windowMs >= minute && windowMs % minute === 0) return `${windowMs / minute} m`
  return `${Math.max(1, Math.ceil(windowMs / 1000))} s`
}

function getUpstashLimiter(namespace: string, config: RateLimitConfig): Ratelimit | null {
  const redis = getUpstashRedis()
  if (!redis) return null

  const cacheKey = `${namespace}:${config.limit}:${config.windowMs}`
  const existing = upstashLimiters.get(cacheKey)
  if (existing) return existing

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(config.limit, windowMsToDuration(config.windowMs)),
    prefix: `rinse:${namespace}`,
    analytics: false,
  })
  upstashLimiters.set(cacheKey, limiter)
  return limiter
}

/** Fixed-window in-memory limiter (per server instance — dev fallback). */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + config.windowMs })
    return { ok: true }
  }

  if (entry.count >= config.limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.reset - now) / 1000)) }
  }

  entry.count++
  return { ok: true }
}

export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig,
  namespace: string,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(namespace, config)
  if (limiter) {
    const result = await limiter.limit(key)
    if (!result.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      }
    }
    return { ok: true }
  }
  return checkRateLimit(key, config)
}

export function rateLimitResponse(retryAfterSec = 60): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    },
  )
}

export const RATE_LIMITS = {
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  publicBookingIp: { limit: 15, windowMs: 60 * 60 * 1000 },
  publicBookingPhone: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  publicRead: { limit: 180, windowMs: 60 * 1000 },
  sendEmail: { limit: 30, windowMs: 60 * 60 * 1000 },
  pushSubscribe: { limit: 20, windowMs: 60 * 60 * 1000 },
  accountDelete: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  cspReport: { limit: 60, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>

export async function enforceRateLimit(
  key: string,
  config: RateLimitConfig,
  namespace = 'default',
): Promise<NextResponse | null> {
  const result = await checkRateLimitAsync(key, config, namespace)
  if (result.ok) return null
  return rateLimitResponse(result.retryAfterSec)
}
