import { defineEventHandler } from 'h3'
import { requireAdminToken } from '../../utils/require-admin'
import { listExhibitionCards } from '../../utils/exhibition-overrides'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  return listExhibitionCards()
})
