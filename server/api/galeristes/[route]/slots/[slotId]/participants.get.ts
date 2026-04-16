import { tourRoutes } from '@data/tours'
import { and, eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../../db'
import { attendance, bookings, timeSlots } from '../../../../../db/schema'
import { requireGaleriste } from '../../../../../utils/require-galeriste'

export default defineEventHandler(async (event) => {
  const { routeSlug } = requireGaleriste(event)
  const routeId = `route-${routeSlug}`
  const route = tourRoutes.find(r => r.id === routeId)
  if (!route) {
    throw createError({ statusCode: 404, statusMessage: 'Route not found' })
  }

  const slotId = getRouterParam(event, 'slotId')
  if (!slotId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slotId' })
  }

  const slot = await db.select().from(timeSlots).where(eq(timeSlots.id, slotId)).get()
  if (!slot || slot.tourRouteId !== routeId) {
    throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
  }

  const rows = await db
    .select({
      id: bookings.id,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      phone: bookings.phone,
      numberOfPeople: bookings.numberOfPeople,
      language: bookings.language,
      specialNeeds: bookings.specialNeeds,
    })
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), eq(bookings.status, 'confirmed')))
    .all()

  rows.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))

  const ids = rows.map(r => r.id)
  const attendanceRows = ids.length
    ? await db.select().from(attendance).where(inArray(attendance.bookingId, ids)).all()
    : []
  const attendanceMap = new Map(attendanceRows.map(r => [r.bookingId, r]))

  const participants = rows.map(r => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    phone: r.phone,
    numberOfPeople: r.numberOfPeople,
    language: r.language,
    specialNeeds: r.specialNeeds,
    attended: attendanceMap.has(r.id),
    attendanceNotes: attendanceMap.get(r.id)?.notes ?? null,
  }))

  return {
    slot: {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      language: slot.language,
      capacity: slot.maxParticipants,
    },
    participants,
  }
})
