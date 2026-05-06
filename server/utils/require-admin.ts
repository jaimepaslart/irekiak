import { timingSafeEqual } from 'node:crypto'
import { createError, getHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { enforceRateLimit } from './rate-limit'

/**
 * Validates the `x-admin-token` header against runtimeConfig.adminTokenSecret.
 * Throws 503 if no secret is configured, 401 if missing or mismatching, 429 if
 * the IP exceeds the brute-force threshold. Call at the top of every
 * /api/admin/* endpoint.
 *
 * Rate budget: 60 attempts/min per IP. A legitimate gallerist loads ≤10 admin
 * endpoints per page; an attacker would need ~2^128 tries to crack a 32-char
 * hex token, so 60/min effectively halts brute-force without bothering humans.
 */
export function requireAdminToken(event: H3Event): void {
  enforceRateLimit(event, { key: 'admin.auth', windowMs: 60_000, max: 60 })

  const config = useRuntimeConfig()
  const expected = config.adminTokenSecret
  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'Admin access not configured' })
  }
  const provided = getHeader(event, 'x-admin-token')
  if (!provided) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
