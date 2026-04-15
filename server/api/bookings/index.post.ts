import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { db, sqlite } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { withSlotLock } from '../../utils/booking-lock'
import { sendBookingConfirmation } from '../../utils/email'
import { generateBookingIcs } from '../../utils/ics'
import { notifyGalleriesForBooking } from '../../utils/notify-galleries'
import { pickRouteName } from '../../utils/pick-locale'
import { bookingRequestSchema } from '../../utils/validation'

/**
 * POST /api/bookings
 *
 * Creates a confirmed booking for a given time slot.
 *
 * Concurrency strategy:
 *  1. In-memory per-slot mutex serializes competing requests within the process.
 *  2. Inside the lock we run a SQLite transaction that re-reads the slot,
 *     verifies capacity, inserts the booking and updates booked_count using
 *     optimistic locking on `version` (the UPDATE only matches if version
 *     hasn't changed under our feet).
 *
 * Returns 409 if the slot is full or was modified concurrently, 404 if the
 * slot does not exist, 400 if the payload is invalid.
 */
export default defineEventHandler(async (event) => {
  const parsed = await readValidatedBody(event, (body) => {
    const result = bookingRequestSchema.safeParse(body)
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid booking payload',
        data: result.error.flatten(),
      })
    }
    return result.data
  })

  return await withSlotLock(parsed.tourSlotId, async () => {
    const tx = sqlite.transaction(() => {
      const slot = db
        .select()
        .from(timeSlots)
        .where(eq(timeSlots.id, parsed.tourSlotId))
        .get()

      if (!slot) {
        throw createError({ statusCode: 404, statusMessage: 'Tour slot not found' })
      }
      if (slot.bookedCount + parsed.numberOfPeople > slot.maxParticipants) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Tour slot is full',
          data: { remaining: Math.max(0, slot.maxParticipants - slot.bookedCount) },
        })
      }

      const bookingId = randomUUID()
      const confirmToken = randomUUID().replace(/-/g, '')

      db.insert(bookings)
        .values({
          id: bookingId,
          slotId: slot.id,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          phone: parsed.phone ?? null,
          numberOfPeople: parsed.numberOfPeople,
          language: parsed.language,
          specialNeeds: parsed.specialNeeds ?? null,
          status: 'confirmed',
          confirmToken,
        })
        .run()

      // Optimistic lock: only update if version unchanged. Throws if another
      // request bumped version first (mutex should prevent this but defense
      // in depth against future horizontal scaling).
      const updated = db.update(timeSlots)
        .set({
          bookedCount: slot.bookedCount + parsed.numberOfPeople,
          version: slot.version + 1,
        })
        .where(and(eq(timeSlots.id, slot.id), eq(timeSlots.version, slot.version)))
        .run()

      if (updated.changes === 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Slot was modified concurrently, please retry',
        })
      }

      return { bookingId, confirmToken, slotId: slot.id }
    })

    const { bookingId, confirmToken, slotId } = tx()

    void logAudit({
      actor: 'visitor',
      action: 'booking.create',
      targetType: 'booking',
      targetId: bookingId,
      metadata: {
        email: parsed.email,
        numberOfPeople: parsed.numberOfPeople,
        language: parsed.language,
        slotId,
      },
    })

    // Fire-and-forget confirmation email + gallery notifications
    void (async () => {
      try {
        const slotWithRoute = db
          .select({ slot: timeSlots, route: tourRoutes })
          .from(timeSlots)
          .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
          .where(eq(timeSlots.id, parsed.tourSlotId))
          .get()
        if (!slotWithRoute) return

        const routeName = pickRouteName(slotWithRoute.route, parsed.language)

        const icsContent = generateBookingIcs({
          bookingId,
          routeName,
          date: slotWithRoute.slot.date,
          startTime: slotWithRoute.slot.startTime,
          endTime: slotWithRoute.slot.endTime,
          email: parsed.email,
          guests: parsed.numberOfPeople,
        })

        await sendBookingConfirmation({
          to: parsed.email,
          bookingId,
          confirmToken,
          routeName,
          date: slotWithRoute.slot.date,
          startTime: slotWithRoute.slot.startTime,
          endTime: slotWithRoute.slot.endTime,
          guests: parsed.numberOfPeople,
          language: parsed.language,
          icsContent,
        })

        notifyGalleriesForBooking({
          routeId: slotWithRoute.route.id,
          bookingData: {
            id: bookingId,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            email: parsed.email,
            phone: parsed.phone ?? null,
            numberOfPeople: parsed.numberOfPeople,
            language: parsed.language,
            specialNeeds: parsed.specialNeeds ?? null,
          },
          slot: {
            date: slotWithRoute.slot.date,
            startTime: slotWithRoute.slot.startTime,
            endTime: slotWithRoute.slot.endTime,
          },
          localizedRouteName: routeName,
          action: 'booked',
        })
      }
      catch (err) {
        console.error('[bookings] confirmation email failed:', err)
      }
    })()

    return {
      bookingId,
      confirmToken,
      status: 'confirmed' as const,
    }
  })
})
