import { desc, eq, or } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { attendance, auditLog, bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { requireAdminToken } from '../../../utils/require-admin'

/**
 * GET /api/admin/bookings/:id — Full detail view including audit timeline + attendance.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.id, id))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  // Audit entries targeting this booking (targetId) OR mentioning it in metadata
  const auditEntries = await db
    .select()
    .from(auditLog)
    .where(or(eq(auditLog.targetId, id), eq(auditLog.targetType, 'booking')))
    .orderBy(desc(auditLog.timestamp))
    .limit(200)

  const bookingAudit = auditEntries
    .filter((e) => {
      if (e.targetId === id) return true
      if (e.metadata) {
        try { return String(e.metadata).includes(id) }
        catch { return false }
      }
      return false
    })
    .map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      actor: e.actor,
      action: e.action,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }))

  const att = await db.select().from(attendance).where(eq(attendance.bookingId, id)).get()

  return {
    booking: row.booking,
    slot: row.slot,
    route: row.route,
    audit: bookingAudit,
    attendance: att ?? null,
  }
})
