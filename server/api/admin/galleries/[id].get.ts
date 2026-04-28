import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdminToken } from '../../../utils/require-admin'
import { getGalleryContactFromOverride } from '../../../utils/gallery-contacts'
import { getGalleryWithOverride } from '../../../utils/gallery-overrides'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  const result = getGalleryWithOverride(id)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Gallery not found' })
  return {
    ...result,
    contact: getGalleryContactFromOverride(id, result.override),
  }
})
