import { galleries } from '@data/galleries'
import { tourRoutes } from '@data/tours'
import { createError, defineEventHandler } from 'h3'
import type { Gallery } from '#types/gallery'
import { requireGaleriste } from '../../../utils/require-galeriste'

export default defineEventHandler((event) => {
  const { routeSlug } = requireGaleriste(event)
  const routeId = `route-${routeSlug}`
  const route = tourRoutes.find(r => r.id === routeId)
  if (!route) {
    throw createError({ statusCode: 404, statusMessage: 'Route not found' })
  }

  const routeGalleries = route.galleryIds
    .map((id: string) => (galleries as Gallery[]).find((g: Gallery) => g.id === id))
    .filter((g: Gallery | undefined): g is Gallery => g !== undefined)
    .map((g: Gallery) => ({
      id: g.id,
      name: {
        eu: g.name,
        es: g.name,
        fr: g.name,
        en: g.name,
      },
      color: route.color,
    }))

  return {
    ok: true as const,
    route: {
      id: route.id,
      slug: routeSlug,
      name: route.name,
      galleries: routeGalleries,
    },
  }
})
