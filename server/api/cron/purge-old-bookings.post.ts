import { and, eq, lt } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { bookings, timeSlots } from '../../db/schema'
import { logAudit } from '../../utils/audit'

/**
 * POST /api/cron/purge-old-bookings — GDPR retention cleanup.
 * Requires Bearer token matching CRON_SECRET env var.
 *
 * Strategy: anonymize bookings whose slot date is more than 90 days in the past.
 * (We anonymize rather than delete to keep audit log references valid.)
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = (config as unknown as { cronSecret?: string }).cronSecret
  const provided = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || !provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!

  // Find candidates: bookings whose slot.date < cutoff AND not already purged
  const rows = await db
    .select({
      id: bookings.id,
      email: bookings.email,
      slotDate: timeSlots.date,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .where(and(
      lt(timeSlots.date, cutoff),
    ))

  let purged = 0
  for (const r of rows) {
    if (r.email.startsWith('purged-') || r.email.endsWith('@deleted.local')) continue
    await db.update(bookings)
      .set({
        firstName: 'PURGED',
        lastName: 'PURGED',
        email: `purged-${r.id.slice(0, 8)}@deleted.local`,
        phone: null,
        specialNeeds: null,
        confirmToken: `purged-${r.id}`,
      })
      .where(eq(bookings.id, r.id))
      .run()
    purged++
  }

  void logAudit({
    actor: 'system',
    action: 'retention.purge',
    targetType: 'cron',
    metadata: { cutoff, examined: rows.length, purged },
  })

  return { ok: true, cutoff, examined: rows.length, purged }
})
