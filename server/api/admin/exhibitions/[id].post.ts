import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { exhibitionOverrides } from '../../../db/schema'
import { requireAdminToken } from '../../../utils/require-admin'
import { logAudit } from '../../../utils/audit'
import { isValidExhibitionId } from '../../../utils/exhibition-overrides'

const nullableString = z.string().trim().max(5000).nullable().optional()
const nullableShort = z.string().trim().max(500).nullable().optional()

const bodySchema = z.object({
  artistName: nullableShort,
  titleEu: nullableShort,
  titleEs: nullableShort,
  titleFr: nullableShort,
  titleEn: nullableShort,
  descriptionEu: nullableString,
  descriptionEs: nullableString,
  descriptionFr: nullableString,
  descriptionEn: nullableString,
  externalUrl: z.preprocess(
    v => (v === '' || v === undefined ? null : v),
    z.string().url().max(500).nullable(),
  ),
})

function normalise(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null
  const trimmed = v.trim()
  return trimmed === '' ? null : trimmed
}

const TEXT_FIELDS = ['artistName', 'titleEu', 'titleEs', 'titleFr', 'titleEn', 'descriptionEu', 'descriptionEs', 'descriptionFr', 'descriptionEn', 'externalUrl'] as const

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isValidExhibitionId(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  }
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const existing = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null

  const textValues = {
    artistName: normalise(parsed.data.artistName),
    titleEu: normalise(parsed.data.titleEu),
    titleEs: normalise(parsed.data.titleEs),
    titleFr: normalise(parsed.data.titleFr),
    titleEn: normalise(parsed.data.titleEn),
    descriptionEu: normalise(parsed.data.descriptionEu),
    descriptionEs: normalise(parsed.data.descriptionEs),
    descriptionFr: normalise(parsed.data.descriptionFr),
    descriptionEn: normalise(parsed.data.descriptionEn),
    externalUrl: normalise(parsed.data.externalUrl),
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  }

  // Split insert/update so a text save never clobbers imageFilename written
  // concurrently by the image upload endpoint.
  if (existing) {
    await db.update(exhibitionOverrides)
      .set(textValues)
      .where(eq(exhibitionOverrides.exhibitionId, id))
  }
  else {
    await db.insert(exhibitionOverrides).values({
      exhibitionId: id,
      imageFilename: null,
      ...textValues,
    })
  }

  const diff: Record<string, { from: string | null, to: string | null }> = {}
  for (const f of TEXT_FIELDS) {
    const from = existing?.[f] ?? null
    const to = textValues[f]
    if (from !== to) diff[f] = { from, to }
  }

  await logAudit({
    actor: 'admin',
    action: existing ? 'exhibition.update' : 'exhibition.create',
    targetType: 'exhibition',
    targetId: id,
    metadata: { diff },
  })

  return { ok: true }
})
