import { eq } from 'drizzle-orm'
import { exhibitions } from '@data/exhibitions'
import { galleries } from '@data/galleries'
import type { Exhibition, ExhibitionCard } from '#types/exhibition'
import type { TranslatedText } from '#types/gallery'
import { db } from '../db'
import { exhibitionOverrides, type ExhibitionOverrideRow } from '../db/schema'

const galleriesById = new Map(galleries.map(g => [g.id, g]))
const galleryOrder = new Map(galleries.map((g, i) => [g.id, i + 1]))

function defaultArtist(exh: Exhibition): string {
  return exh.artists.map(a => a.name).join(' & ')
}

function mergedTranslated(
  override: Pick<ExhibitionOverrideRow, 'titleEu' | 'titleEs' | 'titleFr' | 'titleEn'> | null,
  base: TranslatedText,
): TranslatedText {
  if (!override) return base
  return {
    eu: override.titleEu ?? base.eu,
    es: override.titleEs ?? base.es,
    fr: override.titleFr ?? base.fr,
    en: override.titleEn ?? base.en,
  }
}

function mergedDescription(
  override: Pick<ExhibitionOverrideRow, 'descriptionEu' | 'descriptionEs' | 'descriptionFr' | 'descriptionEn'> | null,
  base: TranslatedText,
): TranslatedText {
  if (!override) return base
  return {
    eu: override.descriptionEu ?? base.eu,
    es: override.descriptionEs ?? base.es,
    fr: override.descriptionFr ?? base.fr,
    en: override.descriptionEn ?? base.en,
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
    artist: override?.artistName ?? defaultArtist(exh),
    title: mergedTranslated(override, exh.title),
    description: mergedDescription(override, exh.description),
    imageUrl: resolveImageUrl(override, exh),
    externalUrl: override?.externalUrl ?? gallery?.website ?? null,
    overridden: isOverridden(override),
  }
}

export function getExhibitionCard(id: string): ExhibitionCard | null {
  const exh = exhibitions.find(e => e.id === id)
  if (!exh) return null
  const override = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
  return buildCard(exh, override)
}

export function listExhibitionCards(): ExhibitionCard[] {
  const overrides = db.select().from(exhibitionOverrides).all()
  const byId = new Map(overrides.map(o => [o.exhibitionId, o]))
  return exhibitions
    .slice()
    .sort((a, b) => (galleryOrder.get(a.galleryId) ?? 0) - (galleryOrder.get(b.galleryId) ?? 0))
    .map(exh => buildCard(exh, byId.get(exh.id) ?? null))
}

export function getOverrideRow(id: string): ExhibitionOverrideRow | null {
  return db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
}
