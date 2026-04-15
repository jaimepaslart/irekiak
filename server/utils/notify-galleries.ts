import { galleries } from '@data/galleries'
import { tourRoutes as tourRouteData } from '@data/tours'
import type { Language } from './pick-locale'
import { sendGalleryBookingNotification } from './email-gallery'
import { getGalleryContact } from './gallery-contacts'

interface NotifyParams {
  routeId: string
  bookingData: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    numberOfPeople: number
    language: Language
    specialNeeds: string | null
  }
  slot: { date: string, startTime: string, endTime: string }
  localizedRouteName: string
  action: 'booked' | 'cancelled'
}

/**
 * Fire-and-forget: notify every gallery on the route with `notifyOnBooking=true`.
 * Non-blocking — caller can `void` this directly. Errors are logged but never thrown.
 */
export function notifyGalleriesForBooking(params: NotifyParams): void {
  const staticRoute = tourRouteData.find(r => r.id === params.routeId)
  if (!staticRoute) return

  const routeGalleries = galleries.filter(g => staticRoute.galleryIds.includes(g.id))
  const galleryNames = routeGalleries.map(g => g.name)

  for (const gallery of routeGalleries) {
    const contact = getGalleryContact(gallery.id)
    if (!contact || !contact.notifyOnBooking || !contact.email) continue
    void sendGalleryBookingNotification({
      to: contact.email,
      galleryName: contact.name ?? gallery.name,
      contactLanguage: contact.preferredLanguage,
      booking: params.bookingData,
      slot: params.slot,
      route: { name: params.localizedRouteName, galleries: galleryNames },
      action: params.action,
    })
  }
}
