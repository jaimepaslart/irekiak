import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import QRCode from 'qrcode'
import { useRuntimeConfig } from '#imports'
import { db } from '../../../db'
import { bookings } from '../../../db/schema'

/**
 * GET /api/bookings/:token/qr — Returns SVG QR code pointing to /bookings/:token.
 * Useful for guide on-site check-in. Returns 404 if booking doesn't exist.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.confirmToken, token))
    .get()
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  const config = useRuntimeConfig()
  const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.art'
  const url = `${siteUrl.replace(/\/$/, '')}/bookings/${token}`

  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#003153',
      light: '#FFFFFF',
    },
    width: 240,
  })

  setHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return svg
})
