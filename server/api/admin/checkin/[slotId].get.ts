import { and, eq, ne } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { requireAdminToken } from '../../../utils/require-admin'

/**
 * GET /api/admin/checkin/:slotId — Print-friendly participant list for a slot.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const slotId = getRouterParam(event, 'slotId')
  if (!slotId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slotId' })
  }

  const slot = await db
    .select({ slot: timeSlots, route: tourRoutes })
    .from(timeSlots)
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(timeSlots.id, slotId))
    .get()

  if (!slot) {
    throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
  }

  const participants = await db
    .select({
      id: bookings.id,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      email: bookings.email,
      phone: bookings.phone,
      guests: bookings.numberOfPeople,
      language: bookings.language,
      specialNeeds: bookings.specialNeeds,
      confirmToken: bookings.confirmToken,
    })
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), ne(bookings.status, 'cancelled')))
    .all()

  // Sort by last name client-safe
  participants.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))

  const totalGuests = participants.reduce((acc, p) => acc + p.guests, 0)

  return {
    slot: {
      id: slot.slot.id,
      date: slot.slot.date,
      startTime: slot.slot.startTime,
      endTime: slot.slot.endTime,
      language: slot.slot.language,
      maxParticipants: slot.slot.maxParticipants,
      bookedCount: slot.slot.bookedCount,
    },
    route: {
      id: slot.route.id,
      nameEu: slot.route.nameEu,
      nameEs: slot.route.nameEs,
      nameFr: slot.route.nameFr,
      nameEn: slot.route.nameEn,
      color: slot.route.color,
    },
    participants,
    totalGuests,
  }
})
