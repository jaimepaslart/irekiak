import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdminToken } from '../../../utils/require-admin'
import { getExhibitionCard, getOverrideRow } from '../../../utils/exhibition-overrides'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  const card = getExhibitionCard(id)
  if (!card) throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  return { card, override: getOverrideRow(id) }
})
