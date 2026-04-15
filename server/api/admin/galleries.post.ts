import { sql } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db } from '../../db'
import { galleryContactOverrides } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { requireAdminToken } from '../../utils/require-admin'

const schema = z.object({
  galleryId: z.string().min(1).max(50),
  email: z.string().trim().toLowerCase().email().max(255).nullable().optional(),
  name: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  preferredLanguage: z.enum(['eu', 'es', 'fr', 'en']).nullable().optional(),
  notifyOnBooking: z.boolean().nullable().optional(),
  receiveDailyDigest: z.boolean().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  await db.insert(galleryContactOverrides)
    .values({
      galleryId: parsed.galleryId,
      email: parsed.email ?? null,
      name: parsed.name ?? null,
      phone: parsed.phone ?? null,
      preferredLanguage: parsed.preferredLanguage ?? null,
      notifyOnBooking: parsed.notifyOnBooking ?? null,
      receiveDailyDigest: parsed.receiveDailyDigest ?? null,
      updatedBy: 'admin',
    })
    .onConflictDoUpdate({
      target: galleryContactOverrides.galleryId,
      set: {
        email: parsed.email ?? null,
        name: parsed.name ?? null,
        phone: parsed.phone ?? null,
        preferredLanguage: parsed.preferredLanguage ?? null,
        notifyOnBooking: parsed.notifyOnBooking ?? null,
        receiveDailyDigest: parsed.receiveDailyDigest ?? null,
        updatedBy: 'admin',
        updatedAt: sql`(datetime('now'))`,
      },
    })
    .run()

  void logAudit({
    actor: 'admin',
    action: 'gallery.update',
    targetType: 'gallery',
    targetId: parsed.galleryId,
    metadata: parsed,
  })

  return { ok: true }
})
