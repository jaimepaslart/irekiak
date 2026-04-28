import { createError, defineEventHandler, getRouterParam, readMultipartFormData } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { exhibitionOverrides } from '../../../../db/schema'
import { requireAdminToken } from '../../../../utils/require-admin'
import { logAudit } from '../../../../utils/audit'
import { deleteExhibitionImage, saveExhibitionImage } from '../../../../utils/image-upload'
import { isValidExhibitionId } from '../../../../utils/exhibition-overrides'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isValidExhibitionId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  }
  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file' && p.data && p.data.length > 0)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  }

  const { filename } = await saveExhibitionImage(filePart.data, filePart.type, id)

  try {
    const existing = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
    const oldFilename = existing?.imageFilename ?? null
    const now = new Date().toISOString()

    if (existing) {
      await db.update(exhibitionOverrides)
        .set({ imageFilename: filename, updatedAt: now, updatedBy: 'admin' })
        .where(eq(exhibitionOverrides.exhibitionId, id))
    }
    else {
      await db.insert(exhibitionOverrides).values({
        exhibitionId: id,
        imageFilename: filename,
        updatedAt: now,
        updatedBy: 'admin',
      })
    }

    if (oldFilename && oldFilename !== filename) {
      await deleteExhibitionImage(oldFilename)
    }

    await logAudit({
      actor: 'admin',
      action: 'exhibition.image.upload',
      targetType: 'exhibition',
      targetId: id,
      metadata: { filename, replaced: oldFilename },
    })

    return { filename, url: `/api/images/exhibitions/${filename}` }
  }
  catch (err) {
    // DB write failed — clean up the orphan file we just saved
    await deleteExhibitionImage(filename)
    console.error('[exhibition.image.upload] DB write failed', { id, filename, err })
    throw createError({ statusCode: 500, statusMessage: 'Could not save image override' })
  }
})
