import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { galleryContactOverrides } from '../../../db/schema'
import { requireAdminToken } from '../../../utils/require-admin'
import { logAudit } from '../../../utils/audit'
import { isValidGalleryId } from '../../../utils/gallery-overrides'

const nullableShort = z.string().trim().max(500).nullable().optional()
const nullableLong = z.string().trim().max(8000).nullable().optional()
const nullableUrl = z.preprocess(
  v => (v === '' || v === undefined ? null : v),
  z.string().url().max(500).nullable().optional(),
)

const bodySchema = z.object({
  // Identity
  galleryName: nullableShort,
  address: nullableShort,
  city: nullableShort,
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  // Multilingual
  descriptionEu: nullableLong,
  descriptionEs: nullableLong,
  descriptionFr: nullableLong,
  descriptionEn: nullableLong,
  openingHoursEu: nullableShort,
  openingHoursEs: nullableShort,
  openingHoursFr: nullableShort,
  openingHoursEn: nullableShort,
  // Links
  website: nullableUrl,
  instagram: nullableUrl,
  // Contact
  email: z.preprocess(
    v => (v === '' || v === undefined ? null : v),
    z.string().email().max(255).nullable().optional(),
  ),
  contactName: nullableShort,
  phone: nullableShort,
  preferredLanguage: z.enum(['eu', 'es', 'fr', 'en']).nullable().optional(),
  notifyOnBooking: z.boolean().nullable().optional(),
  receiveDailyDigest: z.boolean().nullable().optional(),
})

function normaliseStr(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null
  const t = v.trim()
  return t === '' ? null : t
}

function normaliseNum(v: number | null | undefined): string | null {
  return v === null || v === undefined ? null : String(v)
}

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isValidGalleryId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Gallery not found' })
  }
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const existing = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, id)).get() ?? null

  // Image filename is preserved across text saves — only the image endpoints touch it.
  const values = {
    galleryName: normaliseStr(parsed.data.galleryName),
    address: normaliseStr(parsed.data.address),
    city: normaliseStr(parsed.data.city),
    lat: normaliseNum(parsed.data.lat),
    lng: normaliseNum(parsed.data.lng),
    descriptionEu: normaliseStr(parsed.data.descriptionEu),
    descriptionEs: normaliseStr(parsed.data.descriptionEs),
    descriptionFr: normaliseStr(parsed.data.descriptionFr),
    descriptionEn: normaliseStr(parsed.data.descriptionEn),
    openingHoursEu: normaliseStr(parsed.data.openingHoursEu),
    openingHoursEs: normaliseStr(parsed.data.openingHoursEs),
    openingHoursFr: normaliseStr(parsed.data.openingHoursFr),
    openingHoursEn: normaliseStr(parsed.data.openingHoursEn),
    website: normaliseStr(parsed.data.website),
    instagram: normaliseStr(parsed.data.instagram),
    email: normaliseStr(parsed.data.email),
    contactName: normaliseStr(parsed.data.contactName),
    phone: normaliseStr(parsed.data.phone),
    preferredLanguage: parsed.data.preferredLanguage ?? null,
    notifyOnBooking: parsed.data.notifyOnBooking ?? null,
    receiveDailyDigest: parsed.data.receiveDailyDigest ?? null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  }

  if (existing) {
    await db.update(galleryContactOverrides).set(values).where(eq(galleryContactOverrides.galleryId, id))
  }
  else {
    await db.insert(galleryContactOverrides).values({
      galleryId: id,
      imageFilename: null,
      ...values,
    })
  }

  // Build a real diff (skip updatedAt/updatedBy — they always change).
  const TRACKED_FIELDS = [
    'galleryName', 'address', 'city', 'lat', 'lng',
    'descriptionEu', 'descriptionEs', 'descriptionFr', 'descriptionEn',
    'openingHoursEu', 'openingHoursEs', 'openingHoursFr', 'openingHoursEn',
    'website', 'instagram',
    'email', 'contactName', 'phone', 'preferredLanguage',
    'notifyOnBooking', 'receiveDailyDigest',
  ] as const
  const diff: Record<string, { from: unknown, to: unknown }> = {}
  for (const f of TRACKED_FIELDS) {
    const from = existing?.[f] ?? null
    const to = values[f] ?? null
    if (from !== to) diff[f] = { from, to }
  }

  await logAudit({
    actor: 'admin',
    action: existing ? 'gallery.update' : 'gallery.create',
    targetType: 'gallery',
    targetId: id,
    metadata: { diff },
  })

  return { ok: true }
})
