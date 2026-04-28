import { eq } from 'drizzle-orm'
import { galleries } from '@data/galleries'
import type { Gallery, TranslatedText } from '#types/gallery'
import { db } from '../db'
import { galleryContactOverrides, type GalleryContactOverrideRow } from '../db/schema'

/**
 * Merged view of a gallery: defaults from data/galleries.ts, with admin overrides
 * applied field-by-field. Adds `imageUrl` (resolved URL, either uploaded webp or
 * fallback default) and `overridden` (true if any non-contact field has a value).
 */
export type GalleryView = Gallery & {
  imageUrl: string
  overridden: boolean
}

const galleriesById = new Map(galleries.map(g => [g.id, g]))
const galleriesBySlug = new Map(galleries.map(g => [g.slug, g]))
const galleryOrder = new Map(galleries.map((g, i) => [g.id, i + 1]))

function mergeTranslated(
  override: GalleryContactOverrideRow | null,
  base: TranslatedText,
  prefix: 'description' | 'openingHours',
): TranslatedText {
  if (!override) return base
  return {
    eu: override[`${prefix}Eu`] ?? base.eu,
    es: override[`${prefix}Es`] ?? base.es,
    fr: override[`${prefix}Fr`] ?? base.fr,
    en: override[`${prefix}En`] ?? base.en,
  }
}

function resolveImageUrl(override: GalleryContactOverrideRow | null, base: Gallery): string {
  if (override?.imageFilename) return `/api/images/galleries/${override.imageFilename}`
  return base.image
}

function parseCoord(raw: string | null | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) return fallback
  return n
}

// True iff the override row carries any value beyond contact (so the public-facing
// gallery diverges from data/galleries.ts).
function isOverridden(row: GalleryContactOverrideRow | null): boolean {
  if (!row) return false
  return Boolean(
    row.galleryName
    || row.address
    || row.city
    || row.lat
    || row.lng
    || row.descriptionEu || row.descriptionEs || row.descriptionFr || row.descriptionEn
    || row.openingHoursEu || row.openingHoursEs || row.openingHoursFr || row.openingHoursEn
    || row.website
    || row.instagram
    || row.imageFilename,
  )
}

function buildView(base: Gallery, override: GalleryContactOverrideRow | null): GalleryView {
  return {
    ...base,
    name: override?.galleryName ?? base.name,
    address: override?.address ?? base.address,
    city: override?.city ?? base.city,
    coordinates: {
      lat: parseCoord(override?.lat, base.coordinates.lat, -90, 90),
      lng: parseCoord(override?.lng, base.coordinates.lng, -180, 180),
    },
    description: mergeTranslated(override, base.description, 'description'),
    openingHours: mergeTranslated(override, base.openingHours, 'openingHours'),
    website: override?.website ?? base.website,
    instagram: override?.instagram ?? base.instagram,
    image: resolveImageUrl(override, base),
    imageUrl: resolveImageUrl(override, base),
    overridden: isOverridden(override),
  }
}

export function isValidGalleryId(id: string): boolean {
  return galleriesById.has(id)
}

export function getGalleryById(id: string): GalleryView | null {
  const base = galleriesById.get(id)
  if (!base) return null
  const override = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, id)).get() ?? null
  return buildView(base, override)
}

export function getGalleryBySlug(slug: string): GalleryView | null {
  const base = galleriesBySlug.get(slug)
  if (!base) return null
  const override = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, base.id)).get() ?? null
  return buildView(base, override)
}

export function getGalleryWithOverride(id: string): {
  gallery: GalleryView
  defaults: GalleryView
  override: GalleryContactOverrideRow | null
} | null {
  const base = galleriesById.get(id)
  if (!base) return null
  const override = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, id)).get() ?? null
  return {
    gallery: buildView(base, override),
    defaults: buildView(base, null),
    override,
  }
}

export function listGalleries(): GalleryView[] {
  const overrides = db.select().from(galleryContactOverrides).all()
  const byId = new Map(overrides.map(o => [o.galleryId, o]))
  return galleries
    .slice()
    .sort((a, b) => (galleryOrder.get(a.id) ?? 0) - (galleryOrder.get(b.id) ?? 0))
    .map(g => buildView(g, byId.get(g.id) ?? null))
}
