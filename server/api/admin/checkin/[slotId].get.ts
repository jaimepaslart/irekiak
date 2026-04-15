import { and, eq, inArray, ne } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { attendance, bookings, timeSlots, tourRoutes } from '../../../db/schema'
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

  // Attendance state
  const ids = participants.map(p => p.id)
  const attendanceRows = ids.length
    ? await db.select().from(attendance).where(inArray(attendance.bookingId, ids)).all()
    : []
  const attendanceMap = new Map(attendanceRows.map(r => [r.bookingId, r]))
  const participantsWithAttendance = participants.map(p => ({
    ...p,
    attended: attendanceMap.has(p.id),
    attendanceNotes: attendanceMap.get(p.id)?.notes ?? null,
  }))
  const attendedCount = attendanceRows.length

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
    participants: participantsWithAttendance,
    totalGuests,
    attendedCount,
  }
})
