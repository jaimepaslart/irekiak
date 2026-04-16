import { createHmac, timingSafeEqual } from 'node:crypto'
import { useRuntimeConfig } from '#imports'

export function signRouteToken(routeSlug: string): string {
  const config = useRuntimeConfig()
  const secret = (config as { galeristeSecret?: string }).galeristeSecret
  if (!secret) throw new Error('NUXT_GALERISTE_SECRET not configured')
  return createHmac('sha256', secret)
    .update(routeSlug)
    .digest('base64url')
}

export function verifyRouteToken(routeSlug: string, token: string): boolean {
  try {
    const expected = signRouteToken(routeSlug)
    if (token.length !== expected.length) return false
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  }
  catch {
    return false
  }
}

export const ALLOWED_ROUTE_SLUGS = ['arteko-cibrian', 'central-sakana', 'arteztu-ekain'] as const
export type RouteSlug = (typeof ALLOWED_ROUTE_SLUGS)[number]

export function isValidRouteSlug(slug: string): slug is RouteSlug {
  return (ALLOWED_ROUTE_SLUGS as readonly string[]).includes(slug)
}
