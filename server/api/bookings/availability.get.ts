import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { timeSlots } from '../../db/schema'

/**
 * GET /api/bookings/availability?date=2025-09-13&routeId=route-a
 *
 * Both filters are optional. Returns remaining capacity per time slot.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = typeof query.date === 'string' ? query.date : undefined
  const routeId = typeof query.routeId === 'string' ? query.routeId : undefined

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date format. Expected YYYY-MM-DD.',
    })
  }

  const filters = [] as ReturnType<typeof eq>[]
  if (date) filters.push(eq(timeSlots.date, date))
  if (routeId) filters.push(eq(timeSlots.tourRouteId, routeId))

  const rows = filters.length
    ? await db.select().from(timeSlots).where(and(...filters))
    : await db.select().from(timeSlots)

  return rows.map(slot => ({
    id: slot.id,
    routeId: slot.tourRouteId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    language: slot.language,
    maxParticipants: slot.maxParticipants,
    remaining: Math.max(0, slot.maxParticipants - slot.bookedCount),
  }))
})
