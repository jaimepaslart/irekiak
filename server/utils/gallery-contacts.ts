import { eq } from 'drizzle-orm'
import { galleries } from '@data/galleries'
import type { Gallery, GalleryContact } from '#types/gallery'
import { db } from '../db'
import { galleryContactOverrides, type GalleryContactOverrideRow } from '../db/schema'

function mergeContact(base: Gallery | undefined, override: GalleryContactOverrideRow | null): GalleryContact | null {
  if (!override && !base?.contact) return null
  const merged: GalleryContact = {
    email: override?.email ?? base?.contact?.email ?? '',
    name: override?.contactName ?? base?.contact?.name,
    phone: override?.phone ?? base?.contact?.phone,
    preferredLanguage: (override?.preferredLanguage as GalleryContact['preferredLanguage']) ?? base?.contact?.preferredLanguage ?? 'es',
    notifyOnBooking: override?.notifyOnBooking ?? base?.contact?.notifyOnBooking ?? false,
    receiveDailyDigest: override?.receiveDailyDigest ?? base?.contact?.receiveDailyDigest ?? false,
  }
  return merged.email ? merged : null
}

export function getGalleryContact(galleryId: string): GalleryContact | null {
  const base = galleries.find(g => g.id === galleryId)
  const override = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, galleryId)).get() ?? null
  return mergeContact(base, override)
}

// Variant used by callers that already loaded the override row (avoids re-query).
export function getGalleryContactFromOverride(galleryId: string, override: GalleryContactOverrideRow | null): GalleryContact | null {
  return mergeContact(galleries.find(g => g.id === galleryId), override)
}

export function getAllGalleryContacts(): Array<{ id: string, name: string, contact: GalleryContact | null }> {
  const overrides = db.select().from(galleryContactOverrides).all()
  const byId = new Map(overrides.map(r => [r.galleryId, r]))
  return galleries.map(g => ({
    id: g.id,
    name: g.name,
    contact: mergeContact(g, byId.get(g.id) ?? null),
  }))
}
