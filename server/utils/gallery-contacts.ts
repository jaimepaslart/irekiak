import { eq } from 'drizzle-orm'
import { galleries } from '@data/galleries'
import type { GalleryContact } from '#types/gallery'
import { db } from '../db'
import { galleryContactOverrides } from '../db/schema'

/**
 * Returns the effective contact for a gallery: DB override if present (field
 * by field), else falls back to data/galleries.ts source.
 */
export function getGalleryContact(galleryId: string): GalleryContact | null {
  const base = galleries.find(g => g.id === galleryId)
  const override = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, galleryId)).get()

  if (!override && !base?.contact) return null

  const merged: GalleryContact = {
    email: override?.email ?? base?.contact?.email ?? '',
    name: override?.name ?? base?.contact?.name,
    phone: override?.phone ?? base?.contact?.phone,
    preferredLanguage: (override?.preferredLanguage as GalleryContact['preferredLanguage']) ?? base?.contact?.preferredLanguage ?? 'es',
    notifyOnBooking: override?.notifyOnBooking ?? base?.contact?.notifyOnBooking ?? false,
    receiveDailyDigest: override?.receiveDailyDigest ?? base?.contact?.receiveDailyDigest ?? false,
  }
  if (!merged.email) return null
  return merged
}

export function getAllGalleryContacts(): Array<{ id: string, name: string, contact: GalleryContact | null }> {
  return galleries.map(g => ({
    id: g.id,
    name: g.name,
    contact: getGalleryContact(g.id),
  }))
}
