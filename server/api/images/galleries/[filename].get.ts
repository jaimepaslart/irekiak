import { createReadStream } from 'node:fs'
import { createError, defineEventHandler, getHeader, getRouterParam, sendStream, setHeader, setResponseStatus } from 'h3'
import { galleryImagePath, isValidGalleryFilename } from '../../../utils/image-upload'

export default defineEventHandler((event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  if (!isValidGalleryFilename(filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }
  const path = galleryImagePath(filename)!
  const etag = `"${filename}"`
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }
  const isSvg = filename.endsWith('.svg')
  setHeader(event, 'Content-Type', isSvg ? 'image/svg+xml; charset=utf-8' : 'image/webp')
  // Defence-in-depth for SVGs in case any DOMPurify bypass slips through:
  // sandbox neutralises script execution and same-origin access when the file
  // is opened directly as a navigation target.
  if (isSvg) {
    setHeader(event, 'Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)
  }
  const stream = createReadStream(path)
  stream.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOENT') {
      setResponseStatus(event, 404)
      event.node.res.end('Image not found')
    }
  })
  return sendStream(event, stream)
})
