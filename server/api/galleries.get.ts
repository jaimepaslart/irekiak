import { defineEventHandler, setHeader } from 'h3'
import { listGalleries } from '../utils/gallery-overrides'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=300')
  return listGalleries()
})
