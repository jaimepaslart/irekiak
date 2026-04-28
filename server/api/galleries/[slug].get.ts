import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { getGalleryBySlug } from '../../utils/gallery-overrides'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const gallery = getGalleryBySlug(slug)
  if (!gallery) throw createError({ statusCode: 404, statusMessage: 'Gallery not found' })
  setHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=300')
  return gallery
})
