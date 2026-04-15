import { desc, eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { requireAdminToken } from '../../utils/require-admin'

/**
 * GET /api/admin/bookings — Lists every booking with joined slot + route data, newest first.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  return db
    .select({
      id: bookings.id,
      createdAt: bookings.createdAt,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      email: bookings.email,
      phone: bookings.phone,
      guests: bookings.numberOfPeople,
      language: bookings.language,
      status: bookings.status,
      confirmToken: bookings.confirmToken,
      slotDate: timeSlots.date,
      slotStartTime: timeSlots.startTime,
      routeId: tourRoutes.id,
      routeNameEu: tourRoutes.nameEu,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .orderBy(desc(bookings.createdAt))
})
