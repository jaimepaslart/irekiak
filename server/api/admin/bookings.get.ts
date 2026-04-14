import { desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'

/**
 * GET /api/admin/bookings
 *
 * Lists every booking in the system with joined slot + route data, newest first.
 * Requires an `x-admin-token` header matching `runtimeConfig.adminTokenSecret`.
 * Returns 401 if the header is missing or invalid, 503 if no secret is configured.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = config.adminTokenSecret

  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin access not configured',
    })
  }

  const provided = getHeader(event, 'x-admin-token')
  if (!provided || provided !== expected) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const rows = await db
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

  return rows
})
