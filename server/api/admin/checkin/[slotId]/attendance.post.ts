import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db } from '../../../../db'
import { attendance, bookings } from '../../../../db/schema'
import { logAudit } from '../../../../utils/audit'
import { requireAdminToken } from '../../../../utils/require-admin'

const schema = z.object({
  bookingId: z.string().min(1),
  present: z.boolean(),
  notes: z.string().trim().max(500).optional(),
})

/**
 * POST /api/admin/checkin/:slotId/attendance — toggle attendance per booking.
 * Upserts row if present=true, deletes if present=false. Audit logged.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const slotId = getRouterParam(event, 'slotId')
  if (!slotId) throw createError({ statusCode: 400, statusMessage: 'Missing slotId' })

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  // Verify booking belongs to slot
  const booking = await db.select().from(bookings).where(and(eq(bookings.id, parsed.bookingId), eq(bookings.slotId, slotId))).get()
  if (!booking) throw createError({ statusCode: 404, statusMessage: 'Booking not found in slot' })

  if (parsed.present) {
    // Upsert
    const existing = await db.select().from(attendance).where(eq(attendance.bookingId, parsed.bookingId)).get()
    if (existing) {
      await db.update(attendance).set({ notes: parsed.notes ?? null }).where(eq(attendance.bookingId, parsed.bookingId)).run()
    }
    else {
      await db.insert(attendance).values({
        bookingId: parsed.bookingId,
        checkedInBy: 'admin',
        notes: parsed.notes ?? null,
      }).run()
    }
    void logAudit({
      actor: 'admin',
      action: 'attendance.check',
      targetType: 'booking',
      targetId: parsed.bookingId,
      metadata: { slotId, notes: parsed.notes },
    })
  }
  else {
    await db.delete(attendance).where(eq(attendance.bookingId, parsed.bookingId)).run()
    void logAudit({
      actor: 'admin',
      action: 'attendance.uncheck',
      targetType: 'booking',
      targetId: parsed.bookingId,
      metadata: { slotId },
    })
  }

  return { ok: true }
})
