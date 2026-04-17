import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdminToken } from '../../../utils/require-admin'
import { getExhibitionWithOverride } from '../../../utils/exhibition-overrides'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  const result = getExhibitionWithOverride(id)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  return result
})
