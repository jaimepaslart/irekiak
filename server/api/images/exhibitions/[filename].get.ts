import { existsSync, readFileSync } from 'node:fs'
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { exhibitionImagePath, isValidExhibitionFilename } from '../../../utils/image-upload'

export default defineEventHandler((event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  if (!isValidExhibitionFilename(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }
  const path = exhibitionImagePath(filename)
  if (!path || !existsSync(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }
  setHeader(event, 'Content-Type', 'image/webp')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'ETag', `"${filename}"`)
  return readFileSync(path)
})
