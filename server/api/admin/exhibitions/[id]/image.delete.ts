import { createError, defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { exhibitionOverrides } from '../../../../db/schema'
import { exhibitions } from '@data/exhibitions'
import { requireAdminToken } from '../../../../utils/require-admin'
import { logAudit } from '../../../../utils/audit'
import { deleteExhibitionImage } from '../../../../utils/image-upload'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!exhibitions.some(e => e.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  }
  const existing = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null
  const oldFilename = existing?.imageFilename ?? null
  if (!oldFilename) return { ok: true }

  await db.update(exhibitionOverrides)
    .set({ imageFilename: null, updatedAt: new Date().toISOString(), updatedBy: 'admin' })
    .where(eq(exhibitionOverrides.exhibitionId, id))
  await deleteExhibitionImage(oldFilename)

  await logAudit({
    actor: 'admin',
    action: 'exhibition.image.delete',
    targetType: 'exhibition',
    targetId: id,
    metadata: { filename: oldFilename },
  })

  return { ok: true }
})
