import { createError, getHeader, getRouterParam, type H3Event } from 'h3'
import { isValidRouteSlug, verifyRouteToken } from './galeriste-token'

export function requireGaleriste(event: H3Event): { routeSlug: string } {
  const routeSlug = getRouterParam(event, 'route')
  if (!routeSlug || !isValidRouteSlug(routeSlug)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown route' })
  }
  const key = getHeader(event, 'x-galeriste-key')
  if (!key || !verifyRouteToken(routeSlug, key)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { routeSlug }
}
