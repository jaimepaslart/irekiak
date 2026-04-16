import { tourRoutes } from '@data/tours'
import { and, eq, ne, sql } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db } from '../../../db'
import { attendance, bookings, timeSlots } from '../../../db/schema'
import { requireGaleriste } from '../../../utils/require-galeriste'

export default defineEventHandler((event) => {
  const { routeSlug } = requireGaleriste(event)
  const routeId = `route-${routeSlug}`
  const route = tourRoutes.find(r => r.id === routeId)
  if (!route) {
    throw createError({ statusCode: 404, statusMessage: 'Route not found' })
  }

  const slots = db
    .select({
      id: timeSlots.id,
      date: timeSlots.date,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      language: timeSlots.language,
      capacity: timeSlots.maxParticipants,
    })
    .from(timeSlots)
    .where(eq(timeSlots.tourRouteId, routeId))
    .all()
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

  if (slots.length === 0) {
    return { slots: [] }
  }

  const bookedRows = db
    .select({
      slotId: bookings.slotId,
      booked: sql<number>`coalesce(sum(${bookings.numberOfPeople}), 0)`,
    })
    .from(bookings)
    .where(and(eq(bookings.status, 'confirmed'), eq(timeSlots.tourRouteId, routeId)))
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .groupBy(bookings.slotId)
    .all()
  const bookedMap = new Map(bookedRows.map(r => [r.slotId, Number(r.booked)]))

  const attendanceRows = db
    .select({
      slotId: bookings.slotId,
      attended: sql<number>`count(${attendance.bookingId})`,
    })
    .from(bookings)
    .innerJoin(attendance, eq(attendance.bookingId, bookings.id))
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .where(and(ne(bookings.status, 'cancelled'), eq(timeSlots.tourRouteId, routeId)))
    .groupBy(bookings.slotId)
    .all()
  const attendanceMap = new Map(attendanceRows.map(r => [r.slotId, Number(r.attended)]))

  return {
    slots: slots.map(s => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      language: s.language,
      capacity: s.capacity,
      booked: bookedMap.get(s.id) ?? 0,
      attendedCount: attendanceMap.get(s.id) ?? 0,
    })),
  }
})
