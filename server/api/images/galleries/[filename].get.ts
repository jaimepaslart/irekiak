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
  setHeader(event, 'Content-Type', 'image/webp')
  const stream = createReadStream(path)
  stream.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOENT') {
      setResponseStatus(event, 404)
      event.node.res.end('Image not found')
    }
  })
  return sendStream(event, stream)
})
