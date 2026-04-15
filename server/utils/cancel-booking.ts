import { eq } from 'drizzle-orm'
import { db, sqlite } from '../db'
import { bookings, timeSlots } from '../db/schema'
import type { BookingRow, TimeSlotRow, TourRouteRow } from '../db/schema'
import { logAudit } from './audit'
import { sendBookingCancellation } from './email'
import { notifyGalleriesForBooking } from './notify-galleries'
import { coerceLanguage, pickRouteName } from './pick-locale'

export interface CancelResult {
  wasAlreadyCancelled: boolean
}

/**
 * Cancels a booking: marks status=cancelled, releases capacity (optimistic via version++),
 * writes an audit entry, and fires-and-forgets the cancellation emails to visitor + galleries.
 *
 * Idempotent: calling on an already-cancelled booking returns { wasAlreadyCancelled: true }
 * without any side effects.
 */
export async function cancelBooking(
  booking: BookingRow,
  slot: TimeSlotRow,
  route: TourRouteRow,
  actor: 'visitor' | 'admin',
): Promise<CancelResult> {
  if (booking.status === 'cancelled') {
    return { wasAlreadyCancelled: true }
  }

  const tx = sqlite.transaction(() => {
    db.update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, booking.id))
      .run()
    const newBookedCount = Math.max(0, slot.bookedCount - booking.numberOfPeople)
    db.update(timeSlots)
      .set({ bookedCount: newBookedCount, version: slot.version + 1 })
      .where(eq(timeSlots.id, slot.id))
      .run()
  })
  tx()

  void logAudit({
    actor,
    action: 'booking.cancel',
    targetType: 'booking',
    targetId: booking.id,
    metadata: {
      email: booking.email,
      releasedSeats: booking.numberOfPeople,
      slotId: slot.id,
    },
  })

  const lang = coerceLanguage(booking.language)
  const routeName = pickRouteName(route, lang)

  void (async () => {
    try {
      await sendBookingCancellation({
        to: booking.email,
        bookingId: booking.id,
        routeName,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        guests: booking.numberOfPeople,
        language: lang,
      })
    }
    catch (err) {
      console.error('[cancel-booking] visitor email failed:', err)
    }
    notifyGalleriesForBooking({
      routeId: route.id,
      bookingData: {
        id: booking.id,
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phone: booking.phone,
        numberOfPeople: booking.numberOfPeople,
        language: lang,
        specialNeeds: booking.specialNeeds,
      },
      slot: { date: slot.date, startTime: slot.startTime, endTime: slot.endTime },
      localizedRouteName: routeName,
      action: 'cancelled',
    })
  })()

  return { wasAlreadyCancelled: false }
}
