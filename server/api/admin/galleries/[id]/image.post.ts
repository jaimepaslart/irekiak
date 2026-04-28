import { createError, defineEventHandler, getRouterParam, readMultipartFormData } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { galleryContactOverrides } from '../../../../db/schema'
import { requireAdminToken } from '../../../../utils/require-admin'
import { logAudit } from '../../../../utils/audit'
import { deleteGalleryImage, saveGalleryImage } from '../../../../utils/image-upload'
import { isValidGalleryId } from '../../../../utils/gallery-overrides'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isValidGalleryId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Gallery not found' })
  }
  const parts = await readMultipartFormData(event) ?? []
  const filePart = parts.find(p => p.name === 'file' && p.data && p.data.length > 0)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  }

  const { filename } = await saveGalleryImage(filePart.data, filePart.type, id)

  try {
    const existing = db.select().from(galleryContactOverrides).where(eq(galleryContactOverrides.galleryId, id)).get() ?? null
    const oldFilename = existing?.imageFilename ?? null
    const now = new Date().toISOString()

    if (existing) {
      await db.update(galleryContactOverrides)
        .set({ imageFilename: filename, updatedAt: now, updatedBy: 'admin' })
        .where(eq(galleryContactOverrides.galleryId, id))
    }
    else {
      await db.insert(galleryContactOverrides).values({
        galleryId: id,
        imageFilename: filename,
        updatedAt: now,
        updatedBy: 'admin',
      })
    }

    if (oldFilename && oldFilename !== filename) {
      await deleteGalleryImage(oldFilename)
    }

    await logAudit({
      actor: 'admin',
      action: 'gallery.image.upload',
      targetType: 'gallery',
      targetId: id,
      metadata: { filename, replaced: oldFilename },
    })

    return { filename, url: `/api/images/galleries/${filename}` }
  }
  catch (err) {
    await deleteGalleryImage(filename)
    console.error('[gallery.image.upload] DB write failed', { id, filename, err })
    throw createError({ statusCode: 500, statusMessage: 'Could not save image override' })
  }
})
