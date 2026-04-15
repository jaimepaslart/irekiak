import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { galleries } from '@data/galleries'
import { tourRoutes as tourRouteData } from '@data/tours'
import { db, sqlite } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { withSlotLock } from '../../utils/booking-lock'
import { sendBookingConfirmation } from '../../utils/email'
import { sendGalleryBookingNotification } from '../../utils/email-gallery'
import { generateBookingIcs } from '../../utils/ics'
import { bookingRequestSchema } from '../../utils/validation'

/**
 * POST /api/bookings
 *
 * Creates a confirmed booking for a given time slot.
 *
 * Concurrency strategy:
 *  1. An in-memory per-slot mutex serializes competing requests within the process.
 *  2. Inside the lock we run a SQLite transaction that re-reads the slot, verifies
 *     capacity, inserts the booking and increments booked_count + version.
 *
 * Returns 409 if the slot is full, 404 if the slot does not exist.
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
        throw createError({
          statusCode: 404,
          statusMessage: 'Tour slot not found',
        })
      }

      if (slot.bookedCount + parsed.numberOfPeople > slot.maxParticipants) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Tour slot is full',
          data: {
            remaining: Math.max(0, slot.maxParticipants - slot.bookedCount),
          },
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

      db.update(timeSlots)
        .set({
          bookedCount: slot.bookedCount + parsed.numberOfPeople,
          version: slot.version + 1,
        })
        .where(eq(timeSlots.id, slot.id))
        .run()

      return { bookingId, confirmToken }
    })

    const { bookingId, confirmToken } = tx()

    // Fire-and-forget confirmation email. We look up the localized route name,
    // build an ICS attachment, and send via Resend. Errors are logged and do
    // not block the HTTP response.
    void (async () => {
      try {
        const slotWithRoute = db
          .select({ slot: timeSlots, route: tourRoutes })
          .from(timeSlots)
          .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
          .where(eq(timeSlots.id, parsed.tourSlotId))
          .get()

        if (!slotWithRoute) return

        const routeName
          = parsed.language === 'eu' ? slotWithRoute.route.nameEu
            : parsed.language === 'es' ? slotWithRoute.route.nameEs
              : parsed.language === 'fr' ? slotWithRoute.route.nameFr
                : slotWithRoute.route.nameEn

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

        // Notify every gallery on this route that has notifyOnBooking=true
        const staticRoute = tourRouteData.find(r => r.id === slotWithRoute.route.id)
        if (staticRoute) {
          const routeGalleries = galleries.filter(g => staticRoute.galleryIds.includes(g.id))
          const galleryNames = routeGalleries.map(g => g.name)
          for (const gallery of routeGalleries) {
            if (gallery.contact?.notifyOnBooking && gallery.contact.email) {
              void sendGalleryBookingNotification({
                to: gallery.contact.email,
                galleryName: gallery.contact.name ?? gallery.name,
                contactLanguage: gallery.contact.preferredLanguage,
                booking: {
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
                route: {
                  name: routeName,
                  galleries: galleryNames,
                },
                action: 'booked',
              })
            }
          }
        }
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
