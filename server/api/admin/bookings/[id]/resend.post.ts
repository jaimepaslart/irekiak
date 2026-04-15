import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../../db/schema'
import { logAudit } from '../../../../utils/audit'
import { sendBookingConfirmation } from '../../../../utils/email'
import { generateBookingIcs } from '../../../../utils/ics'
import { coerceLanguage, pickRouteName } from '../../../../utils/pick-locale'
import { requireAdminToken } from '../../../../utils/require-admin'

/**
 * POST /api/admin/bookings/:id/resend — Admin-triggered resend (no rate limit).
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.id, id))
    .get()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })

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
      statusMessage: 'Failed to send email',
      data: { error: err instanceof Error ? err.message : String(err) },
    })
  }

  void logAudit({
    actor: 'admin',
    action: 'booking.admin-resend',
    targetType: 'booking',
    targetId: id,
    metadata: { email: row.booking.email },
  })

  return { ok: true }
})
