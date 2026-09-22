import { getOrganizationBySlug } from './organization'

export const ORIGIN_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
export const NEGATIVE_CACHE_TTL_MS = 30 * 1000 // 30 seconds for non-existent slugs

interface CacheEntry {
  origins: string[]
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()

/**
 * Normalizes a user- or env-provided URL string into a standard origin (scheme + host + port).
 * e.g. "https://example.com/foo?bar=1" -> "https://example.com"
 * e.g. "sub.example.com" -> "https://sub.example.com"
 * e.g. "localhost:3000" -> "http://localhost:3000"
 */
export function normalizeOrigin(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  let trimmed = raw.trim()
  if (!trimmed) return null

  // If wildcards or special directives are given:
  if (trimmed === '*' || trimmed === "'self'") return trimmed

  // Prepend protocol if omitted
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
      trimmed = `http://${trimmed}`
    } else {
      trimmed = `https://${trimmed}`
    }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    // Security check: in production, disallow plain http except on localhost / 127.0.0.1
    if (
      process.env.NODE_ENV === 'production' &&
      parsed.protocol === 'http:' &&
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1'
    ) {
      return null
    }
    return parsed.origin.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Normalizes an array or delimited string of origins, returning a unique list.
 */
export function normalizeOrigins(rawList: unknown): string[] {
  if (!rawList) return []
  const items: string[] = []

  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      if (typeof item === 'string') {
        const norm = normalizeOrigin(item)
        if (norm) items.push(norm)
      }
    }
  } else if (typeof rawList === 'string') {
    for (const piece of rawList.split(/[,\n]/)) {
      const norm = normalizeOrigin(piece)
      if (norm) items.push(norm)
    }
  }

  return Array.from(new Set(items))
}

/**
 * Extracts organization slug from standard booking and embed paths.
 * Matches:
 *   - /book/:slug
 *   - /embed/book/:slug
 *   - /api/public/:slug/...
 */
export function extractSlugFromPath(pathname: string): string | null {
  if (!pathname || typeof pathname !== 'string') return null

  const embedMatch = pathname.match(/^\/embed\/book\/([^/?#]+)/)
  if (embedMatch) {
    try {
      return decodeURIComponent(embedMatch[1].trim().toLowerCase())
    } catch {
      return embedMatch[1].trim().toLowerCase()
    }
  }

  const bookMatch = pathname.match(/^\/book\/([^/?#]+)/)
  if (bookMatch) {
    try {
      return decodeURIComponent(bookMatch[1].trim().toLowerCase())
    } catch {
      return bookMatch[1].trim().toLowerCase()
    }
  }

  const apiMatch = pathname.match(/^\/api\/public\/([^/?#]+)/)
  if (apiMatch) {
    try {
      return decodeURIComponent(apiMatch[1].trim().toLowerCase())
    } catch {
      return apiMatch[1].trim().toLowerCase()
    }
  }

  return null
}

/**
 * Clear the in-memory cache (primarily for tests).
 */
export function clearOriginCache(): void {
  memoryCache.clear()
}

/**
 * Look up Upstash Redis if configured in the environment.
 */
async function getUpstashRedisOrigins(slug: string): Promise<string[] | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const res = await fetch(`${url}/get/org_origins:${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as { result: string | null }
    if (!json?.result) return null
    return JSON.parse(json.result) as string[]
  } catch {
    return null
  }
}

async function setUpstashRedisOrigins(slug: string, origins: string[], ttlSeconds = 300): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return

  try {
    await fetch(`${url}/set/org_origins:${encodeURIComponent(slug)}?ex=${ttlSeconds}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(origins),
    })
  } catch {
    // Non-fatal cache failure
  }
}

async function deleteUpstashRedisOrigins(slug: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return

  try {
    await fetch(`${url}/del/org_origins:${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // Non-fatal
  }
}

/**
 * Retrieves the normalized allowed marketing-site origins for a given organization slug.
 * Uses tiered caching (memory cache -> Upstash Redis -> PocketBase).
 */
export async function getAllowedOriginsForSlug(slug: string): Promise<string[]> {
  const normalizedSlug = slug.trim().toLowerCase()
  if (!normalizedSlug) return []

  const now = Date.now()
  const cached = memoryCache.get(normalizedSlug)
  if (cached && cached.expiresAt > now) {
    return cached.origins
  }

  // Check Redis if present
  const redisOrigins = await getUpstashRedisOrigins(normalizedSlug)
  if (redisOrigins && Array.isArray(redisOrigins)) {
    memoryCache.set(normalizedSlug, {
      origins: redisOrigins,
      expiresAt: now + ORIGIN_CACHE_TTL_MS,
    })
    return redisOrigins
  }

  // Cache miss -> Query PocketBase
  try {
    const org = await getOrganizationBySlug(normalizedSlug)
    if (!org) {
      // Negative cache
      memoryCache.set(normalizedSlug, {
        origins: [],
        expiresAt: now + NEGATIVE_CACHE_TTL_MS,
      })
      return []
    }

    const origins = normalizeOrigins(org.allowed_origins)

    // Store in memory & Redis
    memoryCache.set(normalizedSlug, {
      origins,
      expiresAt: now + ORIGIN_CACHE_TTL_MS,
    })
    await setUpstashRedisOrigins(normalizedSlug, origins, 300)

    return origins
  } catch {
    return []
  }
}

/**
 * Invalidate the cache for an organization slug when settings change.
 */
export async function invalidateAllowedOriginsCache(slug: string): Promise<void> {
  const normalizedSlug = slug.trim().toLowerCase()
  if (!normalizedSlug) return
  memoryCache.delete(normalizedSlug)
  await deleteUpstashRedisOrigins(normalizedSlug)
}
