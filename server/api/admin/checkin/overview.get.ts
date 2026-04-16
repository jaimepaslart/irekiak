import { eq, ne, sql } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { attendance, bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { requireAdminToken } from '../../../utils/require-admin'

/**
 * GET /api/admin/checkin/overview — All slots with booking counts + attendance stats.
 */
export default defineEventHandler((event) => {
  requireAdminToken(event)

  const slotsWithRoute = db
    .select({
      id: timeSlots.id,
      date: timeSlots.date,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      language: timeSlots.language,
      maxParticipants: timeSlots.maxParticipants,
      bookedCount: timeSlots.bookedCount,
      routeId: tourRoutes.id,
      routeNameEu: tourRoutes.nameEu,
      routeColor: tourRoutes.color,
    })
    .from(timeSlots)
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .all()
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

  // Attendance count per slot (join bookings → attendance → group)
  const attendanceBySlot = db
    .select({
      slotId: bookings.slotId,
      count: sql<number>`count(${attendance.bookingId})`,
    })
    .from(bookings)
    .innerJoin(attendance, eq(attendance.bookingId, bookings.id))
    .where(ne(bookings.status, 'cancelled'))
    .groupBy(bookings.slotId)
    .all()

  const attCountBySlot = new Map(attendanceBySlot.map(r => [r.slotId, r.count]))

  return slotsWithRoute.map(s => ({
    ...s,
    attendedCount: attCountBySlot.get(s.id) ?? 0,
  }))
})
