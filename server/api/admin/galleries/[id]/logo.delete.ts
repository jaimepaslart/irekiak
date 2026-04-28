import { createError, defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { galleryContactOverrides } from '../../../../db/schema'
import { requireAdminToken } from '../../../../utils/require-admin'
import { logAudit } from '../../../../utils/audit'
import { deleteGalleryLogo } from '../../../../utils/image-upload'
import { isValidGalleryId } from '../../../../utils/gallery-overrides'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isValidGalleryId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Gallery not found' })
  }
  const existing = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, id)).get() ?? null
  const oldFilename = existing?.logoFilename ?? null
  if (!oldFilename) return { ok: true }

  await db.update(galleryContactOverrides)
    .set({ logoFilename: null, updatedAt: new Date().toISOString(), updatedBy: 'admin' })
    .where(eq(galleryContactOverrides.galleryId, id))
  await deleteGalleryLogo(oldFilename)

  await logAudit({
    actor: 'admin',
    action: 'gallery.logo.delete',
    targetType: 'gallery',
    targetId: id,
    metadata: { filename: oldFilename },
  })

  return { ok: true }
})
