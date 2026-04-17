import { eq } from 'drizzle-orm'
import { exhibitions } from '@data/exhibitions'
import { galleries } from '@data/galleries'
import type { Exhibition, ExhibitionCard } from '#types/exhibition'
import type { TranslatedText } from '#types/gallery'
import { db } from '../db'
import { exhibitionOverrides, type ExhibitionOverrideRow } from '../db/schema'

const galleriesById = new Map(galleries.map(g => [g.id, g]))
const galleryOrder = new Map(galleries.map((g, i) => [g.id, i + 1]))
const exhibitionsById = new Map(exhibitions.map(e => [e.id, e]))
const sortedExhibitions = exhibitions.slice().sort(
  (a, b) => (galleryOrder.get(a.galleryId) ?? 0) - (galleryOrder.get(b.galleryId) ?? 0),
)

function mergeTranslated(
  override: ExhibitionOverrideRow | null,
  base: TranslatedText,
  prefix: 'title' | 'description',
): TranslatedText {
  if (!override) return base
  return {
    eu: override[`${prefix}Eu`] ?? base.eu,
    es: override[`${prefix}Es`] ?? base.es,
    fr: override[`${prefix}Fr`] ?? base.fr,
    en: override[`${prefix}En`] ?? base.en,
  }
}

function resolveImageUrl(override: ExhibitionOverrideRow | null, exh: Exhibition): string {
  if (override?.imageFilename) {
    return `/api/images/exhibitions/${override.imageFilename}`
  }
  const gallery = galleriesById.get(exh.galleryId)
  return exh.images[0] ?? gallery?.image ?? '/images/og/og-home.jpg'
}

function isOverridden(row: ExhibitionOverrideRow | null): boolean {
  if (!row) return false
  return Boolean(
    row.artistName
    || row.titleEu || row.titleEs || row.titleFr || row.titleEn
    || row.descriptionEu || row.descriptionEs || row.descriptionFr || row.descriptionEn
    || row.externalUrl
    || row.imageFilename,
  )
}

function buildCard(exh: Exhibition, override: ExhibitionOverrideRow | null): ExhibitionCard {
  const gallery = galleriesById.get(exh.galleryId)
  return {
    id: exh.id,
    galleryId: exh.galleryId,
    galleryName: gallery?.name ?? exh.galleryId,
    number: galleryOrder.get(exh.galleryId) ?? 0,
    artist: override?.artistName ?? exh.artists.map(a => a.name).join(' & '),
    title: mergeTranslated(override, exh.title, 'title'),
    description: mergeTranslated(override, exh.description, 'description'),
    imageUrl: resolveImageUrl(override, exh),
    externalUrl: override?.externalUrl ?? gallery?.website ?? null,
    startDate: exh.startDate,
    endDate: exh.endDate,
    overridden: isOverridden(override),
  }
}

export function isValidExhibitionId(id: string): boolean {
  return exhibitionsById.has(id)
}

export function getExhibitionCard(id: string): ExhibitionCard | null {
  const exh = exhibitionsById.get(id)
  if (!exh) return null
  const override = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
  return buildCard(exh, override)
}

export function getExhibitionWithOverride(id: string): { card: ExhibitionCard, defaults: ExhibitionCard, override: ExhibitionOverrideRow | null } | null {
  const exh = exhibitionsById.get(id)
  if (!exh) return null
  const override = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
  return {
    card: buildCard(exh, override),
    defaults: buildCard(exh, null),
    override,
  }
}

export function listExhibitionCards(): ExhibitionCard[] {
  const overrides = db.select().from(exhibitionOverrides).all()
  const byId = new Map(overrides.map(o => [o.exhibitionId, o]))
  return sortedExhibitions.map(exh => buildCard(exh, byId.get(exh.id) ?? null))
}
