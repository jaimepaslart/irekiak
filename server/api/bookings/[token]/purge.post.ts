import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db, sqlite } from '../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { logAudit } from '../../../utils/audit'
import { cancelBooking } from '../../../utils/cancel-booking'
import { enforceRateLimit } from '../../../utils/rate-limit'

/**
 * POST /api/bookings/:token/purge — GDPR Article 17 right to erasure.
 * First cancels the booking (releases capacity + emails), then anonymizes the
 * row in place (keeps the primary key + status for statistics but wipes all PII).
 *
 * Rationale: full DELETE would orphan audit logs and break referential data.
 * Anonymization preserves aggregate counts while erasing the person.
 */
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'booking.purge', windowMs: 60 * 60 * 1000, max: 3 })

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.confirmToken, token))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  // Cancel first (releases seat capacity + notifies galleries)
  await cancelBooking(row.booking, row.slot, row.route, 'visitor')

  // Then anonymize PII in place
  const anonEmail = `purged-${row.booking.id.slice(0, 8)}@deleted.local`
  const tx = sqlite.transaction(() => {
    db.update(bookings)
      .set({
        firstName: 'PURGED',
        lastName: 'PURGED',
        email: anonEmail,
        phone: null,
        specialNeeds: null,
        status: 'cancelled',
        confirmToken: `purged-${row.booking.id}`,
      })
      .where(eq(bookings.id, row.booking.id))
      .run()
  })
  tx()

  void logAudit({
    actor: 'visitor',
    action: 'booking.purge',
    targetType: 'booking',
    targetId: row.booking.id,
    metadata: { originalEmail: row.booking.email, reason: 'GDPR Article 17' },
  })

  return {
    ok: true,
    message: 'Your personal data has been erased. Your booking has been cancelled.',
  }
})
