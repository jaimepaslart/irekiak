import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db, sqlite } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { sendBookingConfirmation } from '../../utils/email'
import { generateBookingIcs } from '../../utils/ics'
import { notifyGalleriesForBooking } from '../../utils/notify-galleries'
import { pickRouteName } from '../../utils/pick-locale'
import { requireAdminToken } from '../../utils/require-admin'

const manualSchema = z.object({
  tourSlotId: z.string().min(1),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(50).optional(),
  numberOfPeople: z.number().int().min(1).max(12),
  language: z.enum(['eu', 'es', 'fr', 'en']),
  specialNeeds: z.string().trim().max(1000).optional(),
  bypassCapacity: z.boolean().optional().default(false),
  notify: z.boolean().optional().default(true),
  notifyGalleries: z.boolean().optional().default(true),
  acceptsMarketing: z.boolean().optional().default(false),
})

/**
 * POST /api/admin/bookings — Manual booking creation (phone-in).
 * Admin-only. Bypasses rate limit. Optional bypassCapacity + skip email flags.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const parsed = await readValidatedBody(event, (body) => {
    const r = manualSchema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  const tx = sqlite.transaction(() => {
    const slot = db.select().from(timeSlots).where(eq(timeSlots.id, parsed.tourSlotId)).get()
    if (!slot) throw createError({ statusCode: 404, statusMessage: 'Tour slot not found' })

    if (!parsed.bypassCapacity && slot.bookedCount + parsed.numberOfPeople > slot.maxParticipants) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Slot is full (use bypassCapacity to force)',
        data: { remaining: slot.maxParticipants - slot.bookedCount },
      })
    }

    const bookingId = randomUUID()
    const confirmToken = randomUUID().replace(/-/g, '')

    db.insert(bookings).values({
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
      acceptsMarketing: parsed.acceptsMarketing,
    }).run()

    const updated = db.update(timeSlots)
      .set({ bookedCount: slot.bookedCount + parsed.numberOfPeople, version: slot.version + 1 })
      .where(and(eq(timeSlots.id, slot.id), eq(timeSlots.version, slot.version)))
      .run()
    if (updated.changes === 0) {
      throw createError({ statusCode: 409, statusMessage: 'Concurrent modification, retry' })
    }

    return { bookingId, confirmToken, slotId: slot.id }
  })

  const { bookingId, confirmToken, slotId } = tx()

  void logAudit({
    actor: 'admin',
    action: 'booking.admin-create',
    targetType: 'booking',
    targetId: bookingId,
    metadata: {
      email: parsed.email,
      numberOfPeople: parsed.numberOfPeople,
      language: parsed.language,
      slotId,
      bypassCapacity: parsed.bypassCapacity,
      notify: parsed.notify,
    },
  })

  if (parsed.notify || parsed.notifyGalleries) {
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

        if (parsed.notify) {
          const icsContent = generateBookingIcs({
            bookingId, routeName, date: slotWithRoute.slot.date,
            startTime: slotWithRoute.slot.startTime, endTime: slotWithRoute.slot.endTime,
            email: parsed.email, guests: parsed.numberOfPeople,
          })
          await sendBookingConfirmation({
            to: parsed.email, bookingId, confirmToken, routeName,
            date: slotWithRoute.slot.date, startTime: slotWithRoute.slot.startTime,
            endTime: slotWithRoute.slot.endTime, guests: parsed.numberOfPeople,
            language: parsed.language, icsContent,
          })
        }

        if (parsed.notifyGalleries) {
          notifyGalleriesForBooking({
            routeId: slotWithRoute.route.id,
            bookingData: {
              id: bookingId, firstName: parsed.firstName, lastName: parsed.lastName,
              email: parsed.email, phone: parsed.phone ?? null,
              numberOfPeople: parsed.numberOfPeople, language: parsed.language,
              specialNeeds: parsed.specialNeeds ?? null,
            },
            slot: { date: slotWithRoute.slot.date, startTime: slotWithRoute.slot.startTime, endTime: slotWithRoute.slot.endTime },
            localizedRouteName: routeName,
            action: 'booked',
          })
        }
      }
      catch (err) {
        console.error('[admin:create] email failed:', err)
      }
    })()
  }

  return { ok: true, bookingId, confirmToken }
})
