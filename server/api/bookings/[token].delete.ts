import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { galleries } from '@data/galleries'
import { tourRoutes as tourRouteData } from '@data/tours'
import { db, sqlite } from '../../db'
import { bookings, timeSlots, tourRoutes } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { sendBookingCancellation } from '../../utils/email'
import { sendGalleryBookingNotification } from '../../utils/email-gallery'

type Lang = 'eu' | 'es' | 'fr' | 'en'

/**
 * DELETE /api/bookings/:token
 *
 * Public endpoint to cancel a booking using the confirm token. Idempotent:
 * calling it on an already-cancelled booking returns the same payload without
 * changing state. Decrements the slot's bookedCount and notifies the visitor
 * + every gallery on the route.
 */
export default defineEventHandler(async (event) => {
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

  const alreadyCancelled = row.booking.status === 'cancelled'

  if (!alreadyCancelled) {
    // Transaction: mark cancelled + release capacity
    const tx = sqlite.transaction(() => {
      db.update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, row.booking.id))
        .run()

      const newBookedCount = Math.max(0, row.slot.bookedCount - row.booking.numberOfPeople)
      db.update(timeSlots)
        .set({ bookedCount: newBookedCount, version: row.slot.version + 1 })
        .where(eq(timeSlots.id, row.slot.id))
        .run()
    })
    tx()

    void logAudit({
      actor: 'visitor',
      action: 'booking.cancel',
      targetType: 'booking',
      targetId: row.booking.id,
      metadata: {
        email: row.booking.email,
        releasedSeats: row.booking.numberOfPeople,
        slotId: row.slot.id,
      },
    })

    // Fire-and-forget emails
    const lang = row.booking.language as Lang
    const routeName = lang === 'eu' ? row.route.nameEu
      : lang === 'es' ? row.route.nameEs
        : lang === 'fr' ? row.route.nameFr
          : row.route.nameEn

    void (async () => {
      try {
        await sendBookingCancellation({
          to: row.booking.email,
          bookingId: row.booking.id,
          routeName,
          date: row.slot.date,
          startTime: row.slot.startTime,
          endTime: row.slot.endTime,
          guests: row.booking.numberOfPeople,
          language: lang,
        })

        const staticRoute = tourRouteData.find(r => r.id === row.route.id)
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
                  id: row.booking.id,
                  firstName: row.booking.firstName,
                  lastName: row.booking.lastName,
                  email: row.booking.email,
                  phone: row.booking.phone,
                  numberOfPeople: row.booking.numberOfPeople,
                  language: lang,
                  specialNeeds: row.booking.specialNeeds,
                },
                slot: {
                  date: row.slot.date,
                  startTime: row.slot.startTime,
                  endTime: row.slot.endTime,
                },
                route: {
                  name: routeName,
                  galleries: galleryNames,
                },
                action: 'cancelled',
              })
            }
          }
        }
      }
      catch (err) {
        console.error('[bookings:cancel] email failed:', err)
      }
    })()
  }

  return {
    bookingId: row.booking.id,
    status: 'cancelled' as const,
    wasAlreadyCancelled: alreadyCancelled,
  }
})
