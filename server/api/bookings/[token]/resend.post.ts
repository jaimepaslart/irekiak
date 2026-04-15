import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { logAudit } from '../../../utils/audit'
import { sendBookingConfirmation } from '../../../utils/email'
import { generateBookingIcs } from '../../../utils/ics'
import { coerceLanguage, pickRouteName } from '../../../utils/pick-locale'
import { enforceRateLimit } from '../../../utils/rate-limit'

/**
 * POST /api/bookings/:token/resend — Re-sends the confirmation email.
 * Rate-limited to prevent abuse. Only works if booking is still confirmed.
 */
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'booking.resend', windowMs: 15 * 60 * 1000, max: 3 })

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.confirmToken, token))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }
  if (row.booking.status !== 'confirmed') {
    throw createError({ statusCode: 409, statusMessage: 'Booking is not active' })
  }

  const lang = coerceLanguage(row.booking.language)
  const routeName = pickRouteName(row.route, lang)

  const icsContent = generateBookingIcs({
    bookingId: row.booking.id,
    routeName,
    date: row.slot.date,
    startTime: row.slot.startTime,
    endTime: row.slot.endTime,
    email: row.booking.email,
    guests: row.booking.numberOfPeople,
  })

  try {
    await sendBookingConfirmation({
      to: row.booking.email,
      bookingId: row.booking.id,
      confirmToken: row.booking.confirmToken,
      routeName,
      date: row.slot.date,
      startTime: row.slot.startTime,
      endTime: row.slot.endTime,
      guests: row.booking.numberOfPeople,
      language: lang,
      icsContent,
    })
  }
  catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to send email, try again shortly',
    })
  }

  void logAudit({
    actor: 'visitor',
    action: 'booking.resend-email',
    targetType: 'booking',
    targetId: row.booking.id,
    metadata: { email: row.booking.email },
  })

  return { ok: true }
})
