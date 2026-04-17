import { createError, defineEventHandler, getRouterParam, readMultipartFormData } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { exhibitionOverrides } from '../../../../db/schema'
import { exhibitions } from '@data/exhibitions'
import { requireAdminToken } from '../../../../utils/require-admin'
import { logAudit } from '../../../../utils/audit'
import { deleteExhibitionImage, saveExhibitionImage } from '../../../../utils/image-upload'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!exhibitions.some(e => e.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  }
  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file' && p.data && p.data.length > 0)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  }

  const { filename } = await saveExhibitionImage(filePart.data, filePart.type, id)

  const existing = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
  const oldFilename = existing?.imageFilename ?? null

  const base = {
    exhibitionId: id,
    imageFilename: filename,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  }

  if (existing) {
    await db.update(exhibitionOverrides)
      .set({ imageFilename: filename, updatedAt: base.updatedAt, updatedBy: base.updatedBy })
      .where(eq(exhibitionOverrides.exhibitionId, id))
  }
  else {
    await db.insert(exhibitionOverrides).values(base)
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
})
