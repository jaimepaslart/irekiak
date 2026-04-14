import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'

/**
 * GET /api/bookings/:token
 *
 * Fetches a booking by its confirm token, along with slot and route details.
 * Used by the confirmation page after POST /api/bookings succeeds.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({
      booking: bookings,
      slot: timeSlots,
      route: tourRoutes,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.confirmToken, token))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  return {
    booking: {
      id: row.booking.id,
      firstName: row.booking.firstName,
      lastName: row.booking.lastName,
      email: row.booking.email,
      phone: row.booking.phone,
      numberOfPeople: row.booking.numberOfPeople,
      language: row.booking.language,
      specialNeeds: row.booking.specialNeeds,
      status: row.booking.status,
      confirmToken: row.booking.confirmToken,
      createdAt: row.booking.createdAt,
    },
    slot: {
      id: row.slot.id,
      date: row.slot.date,
      startTime: row.slot.startTime,
      endTime: row.slot.endTime,
      language: row.slot.language,
      maxParticipants: row.slot.maxParticipants,
    },
    route: {
      id: row.route.id,
      slug: row.route.slug,
      name: {
        eu: row.route.nameEu,
        es: row.route.nameEs,
        fr: row.route.nameFr,
        en: row.route.nameEn,
      },
      color: row.route.color,
      durationMinutes: row.route.durationMinutes,
      distanceMeters: row.route.distanceMeters,
    },
  }
})
