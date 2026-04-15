import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { cancelBooking } from '../../utils/cancel-booking'

/**
 * DELETE /api/bookings/:token — Public cancel flow. Idempotent.
 */
export default defineEventHandler(async (event) => {
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

  const { wasAlreadyCancelled } = await cancelBooking(row.booking, row.slot, row.route, 'visitor')

  return {
    bookingId: row.booking.id,
    status: 'cancelled' as const,
    wasAlreadyCancelled,
  }
})
