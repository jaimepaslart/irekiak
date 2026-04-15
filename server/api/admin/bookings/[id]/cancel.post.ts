import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../../db/schema'
import { cancelBooking } from '../../../../utils/cancel-booking'
import { requireAdminToken } from '../../../../utils/require-admin'

/**
 * POST /api/admin/bookings/:id/cancel — Admin-initiated cancellation.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking id' })
  }

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.id, id))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  const { wasAlreadyCancelled } = await cancelBooking(row.booking, row.slot, row.route, 'admin')

  return { ok: true, wasAlreadyCancelled }
})
