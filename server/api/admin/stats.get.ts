import { desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'

/**
 * GET /api/admin/stats
 *
 * Returns aggregate stats for the admin dashboard.
 * Requires `x-admin-token` header matching runtimeConfig.adminTokenSecret.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = config.adminTokenSecret
  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'Admin access not configured' })
  }
  const provided = getHeader(event, 'x-admin-token')
  if (!provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Active bookings (exclude cancelled for capacity counts)
  const allBookings = await db.select().from(bookings)
  const activeBookings = allBookings.filter(b => b.status !== 'cancelled')
  const cancelled = allBookings.filter(b => b.status === 'cancelled')

  // Fill rate per slot
  const slots = await db.select().from(timeSlots)
  const fillRate = slots.map(s => ({
    slotId: s.id,
    date: s.date,
    startTime: s.startTime,
    routeId: s.tourRouteId,
    language: s.language,
    booked: s.bookedCount,
    max: s.maxParticipants,
    rate: s.maxParticipants ? Math.round((s.bookedCount / s.maxParticipants) * 100) : 0,
  })).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

  const totalCapacity = slots.reduce((acc, s) => acc + s.maxParticipants, 0)
  const totalBooked = slots.reduce((acc, s) => acc + s.bookedCount, 0)
  const avgFillRate = totalCapacity ? Math.round((totalBooked / totalCapacity) * 100) : 0

  // Breakdown by date, route, language (active only)
  const byDate: Record<string, number> = {}
  const byRoute: Record<string, number> = {}
  const byLanguage: Record<string, number> = {}

  // Need to join active bookings with slots to get their dates + routes
  const joined = await db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      guests: bookings.numberOfPeople,
      language: bookings.language,
      date: timeSlots.date,
      routeId: tourRoutes.id,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))

  for (const row of joined) {
    if (row.bookingStatus === 'cancelled') continue
    byDate[row.date] = (byDate[row.date] ?? 0) + row.guests
    byRoute[row.routeId] = (byRoute[row.routeId] ?? 0) + row.guests
    byLanguage[row.language] = (byLanguage[row.language] ?? 0) + row.guests
  }

  // Recent bookings (last 10, any status)
  const recentRows = await db
    .select({
      id: bookings.id,
      createdAt: bookings.createdAt,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      email: bookings.email,
      guests: bookings.numberOfPeople,
      language: bookings.language,
      status: bookings.status,
      slotDate: timeSlots.date,
      slotStartTime: timeSlots.startTime,
      routeId: tourRoutes.id,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .orderBy(desc(bookings.createdAt))
    .limit(10)

  return {
    totals: {
      bookingsCount: activeBookings.length,
      cancelledCount: cancelled.length,
      guests: activeBookings.reduce((acc, b) => acc + b.numberOfPeople, 0),
      capacity: totalCapacity,
      booked: totalBooked,
      avgFillRate,
    },
    byDate,
    byRoute,
    byLanguage,
    fillRate,
    recentBookings: recentRows,
  }
})
