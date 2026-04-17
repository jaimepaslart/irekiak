import { defineEventHandler, setHeader } from 'h3'
import { listExhibitionCards } from '../utils/exhibition-overrides'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=300')
  return listExhibitionCards()
})
