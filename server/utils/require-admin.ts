import { createError, getHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Validates the `x-admin-token` header against runtimeConfig.adminTokenSecret.
 * Throws 503 if no secret is configured, 401 if missing or mismatching.
 * Call at the top of every /api/admin/* endpoint.
 */
export function requireAdminToken(event: H3Event): void {
  const config = useRuntimeConfig()
  const expected = config.adminTokenSecret
  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'Admin access not configured' })
  }
  const provided = getHeader(event, 'x-admin-token')
  if (!provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
