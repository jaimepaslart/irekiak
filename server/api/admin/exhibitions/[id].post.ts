import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { exhibitionOverrides } from '../../../db/schema'
import { exhibitions } from '@data/exhibitions'
import { requireAdminToken } from '../../../utils/require-admin'
import { logAudit } from '../../../utils/audit'

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
  externalUrl: z.string().trim().url().max(500).nullable().optional().or(z.literal('').transform(() => null)),
})

function normalise(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null
  const trimmed = v.trim()
  return trimmed === '' ? null : trimmed
}

export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!exhibitions.some(e => e.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Exhibition not found' })
  }
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const existing = db.select().from(exhibitionOverrides).where(eq(exhibitionOverrides.exhibitionId, id)).get() ?? null

  const values = {
    exhibitionId: id,
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
    imageFilename: existing?.imageFilename ?? null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  }

  await db.insert(exhibitionOverrides)
    .values(values)
    .onConflictDoUpdate({
      target: exhibitionOverrides.exhibitionId,
      set: {
        artistName: values.artistName,
        titleEu: values.titleEu,
        titleEs: values.titleEs,
        titleFr: values.titleFr,
        titleEn: values.titleEn,
        descriptionEu: values.descriptionEu,
        descriptionEs: values.descriptionEs,
        descriptionFr: values.descriptionFr,
        descriptionEn: values.descriptionEn,
        externalUrl: values.externalUrl,
        updatedAt: values.updatedAt,
        updatedBy: values.updatedBy,
      },
    })

  const diff: Record<string, { from: string | null, to: string | null }> = {}
  const fields = ['artistName', 'titleEu', 'titleEs', 'titleFr', 'titleEn', 'descriptionEu', 'descriptionEs', 'descriptionFr', 'descriptionEn', 'externalUrl'] as const
  for (const f of fields) {
    const from = existing?.[f] ?? null
    const to = values[f]
    if (from !== to) diff[f] = { from, to }
  }

  await logAudit({
    actor: 'admin',
    action: 'exhibition.update',
    targetType: 'exhibition',
    targetId: id,
    metadata: { diff },
  })

  return { ok: true }
})
