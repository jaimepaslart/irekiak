import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { sendLookupEmail, type LookupBookingEntry } from '../../utils/email'
import { pickRouteName } from '../../utils/pick-locale'
import { enforceRateLimit } from '../../utils/rate-limit'

const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
})

/**
 * POST /api/bookings/lookup
 *
 * Resends the list of confirmed bookings associated with an email address to
 * that same address. Anti-enumeration: always returns { success: true } and
 * the front shows a neutral "if this address matches, you will receive an
 * email" regardless of whether anything was found.
 */
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'booking.lookup', windowMs: 10 * 60 * 1000, max: 5 })

  const parsed = await readValidatedBody(event, (body) => {
    const result = lookupSchema.safeParse(body)
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid lookup payload',
        data: result.error.flatten(),
      })
    }
    return result.data
  })

  const email = parsed.email

  const rows = db
    .select({
      confirmToken: bookings.confirmToken,
      language: bookings.language,
      guests: bookings.numberOfPeople,
      date: timeSlots.date,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      route: tourRoutes,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(and(eq(bookings.email, email), eq(bookings.status, 'confirmed')))
    .all()

  void logAudit({
    actor: 'visitor',
    action: 'booking.lookup',
    metadata: { email, foundCount: rows.length },
  })

  if (rows.length > 0) {
    const entries: LookupBookingEntry[] = rows.map(r => ({
      confirmToken: r.confirmToken,
      routeName: pickRouteName(r.route, r.language),
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      guests: r.guests,
    }))

    void sendLookupEmail({
      to: email,
      bookings: entries,
      language: rows[0]!.language,
    })
  }

  return { success: true }
})
