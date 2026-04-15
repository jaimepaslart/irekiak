import { createError, getRequestIP, type H3Event } from 'h3'

interface Bucket {
  hits: number[]
}

const buckets = new Map<string, Bucket>()

interface RateLimitOptions {
  key?: string
  windowMs: number
  max: number
}

/**
 * In-memory sliding window rate limiter. Single-node only — if we scale
 * horizontally later, swap for Redis. Throws 429 when limit exceeded.
 *
 * Usage:
 *   enforceRateLimit(event, { windowMs: 10 * 60 * 1000, max: 5 })
 */
export function enforceRateLimit(event: H3Event, opts: RateLimitOptions): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const key = `${opts.key ?? 'default'}:${ip}`
  const now = Date.now()
  const windowStart = now - opts.windowMs

  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter(t => t >= windowStart)

  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0] ?? now
    const retryAfterSec = Math.ceil((oldest + opts.windowMs - now) / 1000)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
      data: { retryAfterSec },
    })
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)

  // Opportunistic cleanup: if buckets Map grows huge, prune empties
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) {
      if (b.hits.length === 0 || (b.hits[b.hits.length - 1] ?? 0) < windowStart) {
        buckets.delete(k)
      }
    }
  }
}
